import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';
import { promptCategory } from '../src/core/task-prompt.ts';

const entrypoints = ['.agents/skills/promotion-visibility/SKILL.md', '.claude/commands/promote-visibility.md', '.opencode/commands/promote-visibility.md'];
const activityDir = 'templates/activities/ai-visibility';
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, href]) => resolve(dirname(file), href));
}
function verifyLinks(file, expectedActivity) {
  const found = links(file);
  assert.ok(found.includes(expectedActivity), `Activity not reachable from ${file}`);
  for (const link of found) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-visibility-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('shared workflow routes AI visibility requests to the one canonical activity with its budget', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"How do we show up in ChatGPT?"'));
  assert.ok(route, 'AI visibility request route missing');
  assert.match(route, /activity `visibility`/);
  assert.match(route, /`manual`.*`session-search`/);
  assert.ok(links('templates/WORKFLOW.md').includes(resolve(activityDir, 'WORKFLOW.md')));
  const row = workflow.split('\n').find(line => line.startsWith('| visibility |'));
  assert.ok(row, 'AI visibility budget row missing');
  assert.match(row, /20–30 prompts/);
  assert.match(row, /mention rates.*citations.*gap map/);
  const procedure = resolve(activityDir, 'WORKFLOW.md');
  const referenced = links(procedure);
  for (const link of referenced) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
  for (const name of readdirSync(activityDir).filter(n => n !== 'WORKFLOW.md'))
    assert.ok(referenced.includes(resolve(activityDir, name)), `${name} is not linked from the AI visibility procedure`);
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of ['Do not call AI provider APIs', 'ask the user for API keys', 'not a probe result', 'Never ask a model where an answer came from', 'per-product decision', 'marketing/ai-visibility/', 'k of N', 'Not before', 'at most 20 pastes by default', 'next uncovered slots'])
    assert.ok(text.includes(boundary), `Procedure lacks boundary: ${boundary}`);
});

test('AI visibility entrypoints share the activity and remain portable, owned and customization-safe', t => {
  const { root, project } = fixture(t);
  const sourceActivity = resolve(activityDir, 'WORKFLOW.md');
  for (const path of entrypoints) {
    verifyLinks(resolve(path), sourceActivity);
    assert.doesNotMatch(readFileSync(path, 'utf8'), /^model:|^agent:|^context:\s*fork|^subtask:|!`/m);
  }
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installedActivity = join(moved, '.promotion-agent', activityDir, 'WORKFLOW.md');
  for (const path of entrypoints) verifyLinks(join(moved, path), installedActivity);
  for (const name of readdirSync(activityDir))
    assert.equal(readFileSync(join(moved, '.promotion-agent', activityDir, name), 'utf8'), readFileSync(join(activityDir, name), 'utf8'));
  for (const link of links(installedActivity)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  const customized = join(moved, entrypoints[0]);
  writeFileSync(customized, 'User-customized visibility workflow\n');
  const upgraded = previewInstall(moved, 'Ignored');
  assert.equal(upgraded.entries.find(e => e.path === entrypoints[0]).action, 'preserve');
  applyInstall(moved, upgraded, reviewHash(upgraded));
  const removal = previewRemoval(moved);
  applyRemoval(moved, removal, removalHash(removal));
  assert.equal(readFileSync(customized, 'utf8'), 'User-customized visibility workflow\n');
  for (const path of entrypoints.slice(1)) assert.equal(existsSync(join(moved, path)), false);
});

test('AI visibility run task records draft results and gap map and stays open in the review handoff', t => {
  const { project } = fixture(t);
  const taskFile = join(project, 'marketing/TASKS.md');
  const markdown = '# Marketing tasks\n\n## Open\n\n- [ ] T-601 | 2026-11-02 | P1 | visibility | Run AI visibility baseline\n      URL: https://example-desk.example\n      Materials: Approved prompt set version 1; probe ChatGPT, Perplexity, Gemini and Claude.\n\n## Done\n';
  writeFileSync(taskFile, markdown);
  for (const alias of ['visibility', 'ai-visibility', 'GEO', 'aeo']) assert.equal(promptCategory(alias), 'visibility');
  const prepared = prepareTask(project, 'T-601');
  assert.ok(prepared.prompt.includes('AI visibility activity'));
  assert.ok(prepared.prompt.includes('do not call AI provider APIs'));
  assert.ok(prepared.prompt.includes('at most 20 pastes'));
  const runDir = join(project, 'marketing/ai-visibility/2026-11-02');
  mkdirSync(runDir, { recursive: true });
  const run = 'marketing/ai-visibility/2026-11-02/RUN.md';
  const gaps = 'marketing/ai-visibility/2026-11-02/GAPS.md';
  writeFileSync(join(project, run), '# Fictional AI visibility run\n\nSynthetic test record only; no engine was probed.\n');
  writeFileSync(join(project, gaps), '# Fictional citation gap map\n\nSynthetic test record only.\n');
  recordTaskEvidence(project, 'T-601', prepared.revision, 'draft', run, 'Synthetic run results ready for review');
  recordTaskEvidence(project, 'T-601', prepared.revision, 'draft', gaps, 'Synthetic gap map ready for review');
  const data = reviewData(project);
  const task = data.tasks.find(t => t.taskId === 'T-601');
  assert.equal(task.category, 'visibility');
  assert.equal(task.status, 'open');
  assert.deepEqual(task.drafts.map(d => d.reference).sort(), [gaps, run].sort());
  const handoff = reviewPrompt(data, task);
  assert.equal(handoff.target, 'promotion');
  assert.ok(handoff.text.includes(run) && handoff.text.includes(gaps));
  assert.equal(readFileSync(taskFile, 'utf8'), markdown);
});
