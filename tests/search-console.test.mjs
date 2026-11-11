import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { promptCategory } from '../src/core/task-prompt.ts';

const procedure = resolve('templates/activities/search-console/WORKFLOW.md');
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
  const root = mkdtempSync(join(tmpdir(), 'promotion-gsc-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('shared workflow routes Search Console requests to the activity with its budget', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"What does our Search Console data say?"'));
  assert.ok(route, 'Search Console request route missing');
  assert.match(route, /activity `search-console`/);
  assert.match(route, /never their account or keys/);
  assert.match(route, /at most five/);
  assert.ok(links('templates/WORKFLOW.md').includes(procedure));
  assert.match(workflow.split('\n').find(line => line.startsWith('| search-console |')), /at most 5 verified candidates/);
  assert.ok(links('templates/activities/blog/WORKFLOW.md').includes(procedure), 'Blog refresh does not link the Search Console activity');
});

test('Search Console procedure keeps its boundaries and its links and anchors resolve', () => {
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of [
    'one export and produces one report with at most five verified candidates', 'Read only throughout',
    'never signs in to Search Console', 'API keys or OAuth tokens', 'Human required:',
    '## 4. Verify a shortlist', '## 5. Propose changes', '## 6. Save and queue', '## Reading the numbers',
    'Pick at most five pages or queries', '"indexing not verified"', 'No proposal predicts traffic',
    'Queue at most three follow-ups:', 'Not before', 'marketing/search-console/<YYYY-MM-DD>/'])
    assert.ok(text.includes(boundary), `Search Console procedure lacks: ${boundary}`);
  for (const file of [procedure, resolve('templates/WORKFLOW.md'), resolve('templates/activities/blog/WORKFLOW.md')]) {
    for (const link of links(file)) assert.ok(existsSync(link), `Missing linked resource from ${file}: ${link}`);
    for (const [target, anchor] of anchors(file).filter(([t]) => t.endsWith('.md')))
      assert.ok(slugs(target).includes(anchor), `Missing anchor #${anchor} in ${target} (from ${file})`);
  }
});

test('Search Console procedure carries the seo-skills review improvements', () => {
  const text = readFileSync(procedure, 'utf8');
  for (const rule of [
    'buying intent', 'one to three such pages', 'position 11 into the top three',
    'canonical points to itself', '`X-Robots-Tag`', 'server-rendered HTML', 'A failure here is the fix',
    'answer the query in the first paragraph', 'anchor text that describes the target', 'change the title and description instead of the body',
    'daily resubmission', 'paid links break Google\'s spam policies',
    'two shipped changes of the same kind', 'do not propose a third',
    '## Site-wide health check', 'one procedure for this'])
    assert.ok(text.includes(rule), `Search Console procedure lacks: ${rule}`);
  assert.ok(links(procedure).includes(resolve('templates/activities/blog/WORKFLOW.md')), 'Health check does not hand off to the blog site check');
  const blog = readFileSync('templates/activities/blog/WORKFLOW.md', 'utf8');
  for (const rule of ['This is the one site check', 'Do not crawl beyond the sitemap', 'how many were skipped', 'the check covered only the fetched pages', 'most-trafficked pages first'])
    assert.ok(blog.includes(rule), `Blog site check lacks: ${rule}`);
  const order = ['## 4. Verify a shortlist', '## 5. Propose changes', '## 6. Save and queue', '## Site-wide health check', '## Reading the numbers'].map(h => text.indexOf(h));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'Search Console sections out of order');
});

test('Search Console activity ships into an installed workspace and survives relocation', t => {
  const { root, project } = fixture(t);
  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installed = join(moved, '.promotion-agent/templates/activities/search-console/WORKFLOW.md');
  assert.equal(readFileSync(installed, 'utf8'), readFileSync(procedure, 'utf8'));
  for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /activities\/search-console\/WORKFLOW\.md/);
});

test('Search Console task prompt carries the activity rules and a report stays open for review', t => {
  const { project } = fixture(t);
  for (const alias of ['search-console', 'GSC']) assert.equal(promptCategory(alias), 'search-console');
  const taskFile = join(project, 'marketing/TASKS.md');
  const markdown = '# Marketing tasks\n\n## Open\n\n- [ ] T-801 | 2026-11-11 | P2 | search-console | Find pages close to page one\n      Materials: Fictional Performance export for the last 3 months.\n\n## Done\n';
  writeFileSync(taskFile, markdown);
  const prepared = prepareTask(project, 'T-801');
  for (const rule of ['Search Console activity', 'never sign in to my account', 'indexing not verified', 'keep the product repository read only'])
    assert.ok(prepared.prompt.includes(rule), `Prompt lacks: ${rule}`);
  mkdirSync(join(project, 'marketing/search-console/2026-11-11'), { recursive: true });
  const report = 'marketing/search-console/2026-11-11/REPORT.md';
  writeFileSync(join(project, report), '# Fictional Search Console report\n\nSynthetic test record only.\n');
  recordTaskEvidence(project, 'T-801', prepared.revision, 'draft', report, 'Search Console report ready for review');
  const task = reviewData(project).tasks.find(x => x.taskId === 'T-801');
  assert.equal(task.status, 'open');
  assert.deepEqual(task.drafts.map(d => d.reference), [report]);
  assert.equal(readFileSync(taskFile, 'utf8'), markdown);
});
