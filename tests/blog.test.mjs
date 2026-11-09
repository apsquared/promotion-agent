import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { promptCategory } from '../src/core/task-prompt.ts';

const procedure = resolve('templates/activities/blog/WORKFLOW.md');
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));
}
function anchors(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]*)#([^)]+)\)/g)].map(([, href, anchor]) => [href ? resolve(dirname(file), href) : file, anchor]);
}
function slugs(file) {
  return readFileSync(file, 'utf8').split('\n').filter(l => /^#{1,6} /.test(l)).map(l => l.replace(/^#+ /, '').toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-'));
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-blog-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('shared workflow routes blog and refresh requests to the blog activity with its budget', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"Propose a blog article"'));
  assert.ok(route, 'Blog request route missing');
  assert.match(route, /activity `blog`/);
  assert.match(route, /Refresh our post/);
  assert.match(route, /approval before rewriting/);
  assert.ok(links('templates/WORKFLOW.md').includes(procedure));
  const row = workflow.split('\n').find(line => line.startsWith('| blog |'));
  assert.match(row, /1 article proposal or 1 refresh/);
  assert.match(workflow.split('\n').find(line => line.startsWith('| pseo |')), /quality rules/);
  assert.match(workflow, /becomes a refresh of that page, not a new article/);
  assert.ok(links('templates/activities/ai-visibility/WORKFLOW.md').includes(procedure), 'AI visibility refresh advice does not link the blog activity');
  assert.match(readFileSync('templates/marketing/logs/content-ledger.md', 'utf8'), /planned\|published\|refreshed/);
});

test('blog procedure keeps its boundaries and its links and anchors resolve', () => {
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of ['One run prepares **one new article proposal or one refresh**', 'Start from a real question', 'scaled content abuse', 'Never mass-produce', '[[VERIFY: ...]]', 'wait for the user\'s approval before rewriting', 'Never bump a "last updated" date', 'Keep the URL and slug', 'Never queue a refresh for a page that is not live', 'Not before', 'marketing/blog/<slug>/', 'Human required:', 'read only'])
    assert.ok(text.includes(boundary), `Blog procedure lacks: ${boundary}`);
  for (const file of [procedure, resolve('templates/WORKFLOW.md'), resolve('templates/activities/ai-visibility/WORKFLOW.md'), ...['.claude', '.agents'].flatMap(d => [resolve(d, 'skills/blog-refresher/SKILL.md'), resolve(d, 'skills/seo-title-optimization/SKILL.md')])]) {
    for (const link of links(file)) assert.ok(existsSync(link), `Missing linked resource from ${file}: ${link}`);
    for (const [target, anchor] of anchors(file).filter(([t]) => t.endsWith('.md') && (t === procedure || t.endsWith('templates/WORKFLOW.md'))))
      assert.ok(slugs(target).includes(anchor), `Missing anchor #${anchor} in ${target} (from ${file})`);
  }
  for (const d of ['.claude', '.agents']) assert.ok(links(resolve(d, 'skills/blog-refresher/SKILL.md')).includes(procedure), `${d} blog-refresher does not link the blog activity`);
});

test('blog activity ships into an installed workspace and survives relocation', t => {
  const { root, project } = fixture(t);
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installed = join(moved, '.promotion-agent/templates/activities/blog/WORKFLOW.md');
  assert.equal(readFileSync(installed, 'utf8'), readFileSync(procedure, 'utf8'));
  for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /activities\/blog\/WORKFLOW\.md/);
});

test('blog task prompt carries the activity rules and a refresh draft stays open for review', t => {
  const { project } = fixture(t);
  for (const alias of ['blog', 'content', 'Article', 'refresh', 'pseo']) assert.equal(promptCategory(alias), 'blog');
  const taskFile = join(project, 'marketing/TASKS.md');
  const markdown = '# Marketing tasks\n\n## Open\n\n- [ ] T-701 | 2026-11-09 | P2 | refresh | Refresh the onboarding checklist post\n      URL: https://example-desk.example/blog/onboarding-checklist\n      Materials: Fictional page published 2026-08-20; refresh due.\n\n## Done\n';
  writeFileSync(taskFile, markdown);
  const prepared = prepareTask(project, 'T-701');
  for (const rule of ['blog activity', 'wait for my approval before rewriting', 'Do not publish, commit or deploy', '[[VERIFY: ...]]'])
    assert.ok(prepared.prompt.includes(rule), `Prompt lacks: ${rule}`);
  const dir = join(project, 'marketing/blog/onboarding-checklist');
  mkdirSync(dir, { recursive: true });
  const plan = 'marketing/blog/onboarding-checklist/REFRESH-2026-11-09.md';
  writeFileSync(join(project, plan), '# Fictional refresh plan\n\nSynthetic test record only.\n');
  recordTaskEvidence(project, 'T-701', prepared.revision, 'draft', plan, 'Refresh plan ready for approval');
  const task = reviewData(project).tasks.find(x => x.taskId === 'T-701');
  assert.equal(task.status, 'open');
  assert.deepEqual(task.drafts.map(d => d.reference), [plan]);
  assert.equal(readFileSync(taskFile, 'utf8'), markdown);
});
