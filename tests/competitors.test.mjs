import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';
import { promptCategory } from '../src/core/task-prompt.ts';

const entrypoints = ['.agents/skills/promotion-competitors/SKILL.md', '.claude/commands/promote-competitors.md', '.opencode/commands/promote-competitors.md'];
function verifyLinks(file, expectedActivity) {
  const links = [...readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)].map(([, href]) => resolve(dirname(file), href));
  assert.ok(links.includes(expectedActivity), `Activity not reachable from ${file}`);
  for (const link of links) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-competitors-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('competitor entrypoints share the activity and remain portable, owned and customization-safe', t => {
  const { root, project } = fixture(t);
  const sourceActivity = resolve('templates/activities/competitor-analysis.md');
  for (const path of entrypoints) verifyLinks(resolve(path), sourceActivity);
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  for (const path of entrypoints) verifyLinks(join(moved, path), join(moved, '.promotion-agent/templates/activities/competitor-analysis.md'));
  assert.equal(readFileSync(join(moved, '.promotion-agent/templates/activities/competitor-analysis.md'), 'utf8'), readFileSync(sourceActivity, 'utf8'));
  const customized = join(moved, entrypoints[0]);
  writeFileSync(customized, 'User-customized competitor workflow\n');
  const upgraded = previewInstall(moved, 'Ignored');
  assert.equal(upgraded.entries.find(e => e.path === entrypoints[0]).action, 'preserve');
  applyInstall(moved, upgraded, reviewHash(upgraded));
  const removal = previewRemoval(moved);
  applyRemoval(moved, removal, removalHash(removal));
  assert.equal(readFileSync(customized, 'utf8'), 'User-customized competitor workflow\n');
  for (const path of entrypoints.slice(1)) assert.equal(existsSync(join(moved, path)), false);
});

test('competitor research task survives preparation, draft evidence and review handoff without completion', t => {
  const { project } = fixture(t);
  const taskFile = join(project, 'marketing/TASKS.md');
  const markdown = '# Marketing tasks\n\n## Open\n\n- [ ] T-501 | 2026-09-29 | P1 | competitor | Research Note Harbor mentions\n      URL: https://note-harbor.example\n      Materials: Compare Note Harbor with Example Desk; find verified public discussions.\n\n## Done\n';
  writeFileSync(taskFile, markdown);
  assert.equal(promptCategory('competitor'), 'competitor');
  const prepared = prepareTask(project, 'T-501');
  assert.ok(prepared.prompt.includes('Note Harbor'));
  const report = 'marketing/competitor-report.md';
  const reportText = '# Fictional competitor research\n\nSynthetic test report only; no live research was performed.\n';
  writeFileSync(join(project, report), reportText);
  const evidence = recordTaskEvidence(project, 'T-501', prepared.revision, 'draft', report, 'Synthetic report ready for review');
  const data = reviewData(project);
  const task = data.tasks.find(t => t.taskId === 'T-501');
  assert.equal(task.category, 'competitor');
  assert.equal(task.status, 'open');
  assert.equal(task.evidence[0].preview.text, reportText);
  const handoff = reviewPrompt(data, task, 'revise', 'Separate verified mentions from inaccessible leads.');
  assert.ok(handoff.includes(evidence.hash));
  assert.ok(handoff.includes(report));
  assert.ok(handoff.includes('Separate verified mentions'));
  assert.equal(readFileSync(taskFile, 'utf8'), markdown);
});
