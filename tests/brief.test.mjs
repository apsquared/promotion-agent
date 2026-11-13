import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { promotionBrief, localDate } from '../src/interactive/brief.ts';
import { inspectProject, recordTaskEvidence, setSelectedTaskDisposition } from '../src/interactive/tasks.ts';
import { observerSource } from '../src/onboarding/workspace.ts';
import { Store } from '../src/storage/store.ts';

const procedure = resolve('templates/brief/WORKFLOW.md');
const day = 24 * 60 * 60 * 1000;
const links = file => [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
  .filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-brief-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const project = join(dir, 'workspace');
  cpSync('examples/example-desk', project, { recursive: true });
  const observed = join(dir, 'observed');
  mkdirSync(observed);
  writeFileSync(join(project, 'promotion-source.json'), JSON.stringify(observerSource(project, observed)));
  const now = new Date();
  const tz = 'America/New_York';
  const today = localDate(now, tz);
  const later = localDate(new Date(now.valueOf() + 20 * day), tz);
  writeFileSync(join(project, 'marketing/TASKS.md'), `# Marketing tasks — Example Desk

## Open

- [ ] T-001 | 2026-09-26 | P1 | directory | Ready directory kit
      Materials: Name: Example Desk

- [ ] T-002 | 2026-09-26 | P2 | engagement | Sign in and reply
      Materials: Human required: sign in to the forum account.

- [ ] T-003 | 2026-09-26 | P2 | blog | Refresh the guide later
      Materials: Not before ${later}.

- [ ] T-004 | 2026-09-26 | P3 | other | Measure the post
      Materials: Follow-up to T-006. After the post goes live, count clicks.

- [ ] T-005 | 2026-09-26 | P1 | social | Verify the scheduled post
      Materials: Approved post text.

- [ ] T-007 | 2026-09-26 | P2 | other | Due today
      Materials: Not before ${today}. Prepare the next kit.

- [ ] T-008 | 2026-09-26 | P2 | directory | Draft to review
      Materials: Kit for the example directory.

- [ ] T-009 | 2026-09-26 | P3 | other | Snoozed task
      Materials: Not now.

- [ ] T-010 | 2026-09-26 | P3 | other | Skipped task
      Materials: Not wanted.

## Done

- [x] T-006 | 2026-09-20 | P2 | social | Publish the post
      Materials: Published.
`);
  mkdirSync(join(project, 'marketing/drafts'), { recursive: true });
  writeFileSync(join(project, 'marketing/drafts/post.md'), 'Approved post text');
  writeFileSync(join(project, 'marketing/drafts/kit.md'), 'Kit');
  let hash = inspectProject(project).snapshot.hash;
  const past = new Date(now.valueOf() - 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
  recordTaskEvidence(project, 'T-005', hash, 'draft', 'marketing/drafts/post.md',
    `Scheduled post: manual\nChannel: x\nAccount: example\nScheduled for: ${past}\nProvider reference: handed to user\nStatus: scheduled, unverified`);
  recordTaskEvidence(project, 'T-008', hash, 'draft', 'marketing/drafts/kit.md', 'Kit drafted for review');
  const database = join(dir, 'portfolio.sqlite');
  setSelectedTaskDisposition(project, 'T-009', hash, database, 'snoozed', 'After the holidays', '2099-01-01T00:00:00.000Z');
  setSelectedTaskDisposition(project, 'T-010', hash, database, 'skipped', 'Not a fit', null);
  return { dir, project, database, now };
}

const ids = list => list.map(item => item.taskId);

test('brief sorts open tasks into needs-you, posts to check, ready, waiting and snoozed', t => {
  const f = fixture(t);
  const brief = promotionBrief([], f.database, undefined, f.now);
  assert.deepEqual(brief.unavailable, []);
  const [p] = brief.projects;
  assert.equal(p.project.displayName, 'Example Desk');
  assert.deepEqual(ids(p.needsYou), ['T-002', 'T-008']);
  assert.match(p.needsYou[1].note, /awaits review: marketing\/drafts\/kit\.md/);
  assert.deepEqual(ids(p.verifyPosts), ['T-005']);
  assert.match(p.verifyPosts[0].note, /check the live post/);
  assert.deepEqual(ids(p.ready), ['T-001', 'T-007']);
  assert.match(p.ready[1].note, /Became due/);
  assert.deepEqual(ids(p.waiting), ['T-003', 'T-004']);
  assert.match(p.waiting[0].note, /^Not before /);
  assert.match(p.waiting[1].note, /Condition: After the post goes live, count clicks\. Parent T-006 is done\./);
  assert.deepEqual(ids(p.snoozed), ['T-009']);
  assert.deepEqual(p.counts, { open: 9, done: 1, skipped: 1, stale: 5 });
  assert.deepEqual(ids(p.recent).sort(), ['T-005', 'T-008']);
  assert.equal(brief.totals.needsYou, 2);
});

test('brief window and scope: since bounds recent records, one workspace works without a registry', t => {
  const f = fixture(t);
  const later = promotionBrief([], f.database, new Date(f.now.valueOf() + 1000).toISOString(), new Date(f.now.valueOf() + 2000));
  assert.deepEqual(later.projects[0].recent, []);
  const single = promotionBrief([f.project], undefined, undefined, f.now);
  // Without the registry, snoozed and skipped state is unknown, so those tasks are ready.
  assert.deepEqual(ids(single.projects[0].ready), ['T-001', 'T-007', 'T-009', 'T-010']);
  assert.throws(() => promotionBrief([]), /--project or --database/);
  assert.throws(() => promotionBrief([f.project], undefined, '2999-01-01T00:00:00Z'), /past UTC timestamp/);
});

test('brief CLI is read only and never creates a registry', t => {
  const f = fixture(t);
  const tasks = readFileSync(join(f.project, 'marketing/TASKS.md'));
  const before = readFileSync(f.database);
  const run = args => spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/promotion.mjs', 'brief', ...args], { encoding: 'utf8' });
  const result = run(['--database', f.database]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).projects[0].project.displayName, 'Example Desk');
  assert.deepEqual(readFileSync(f.database), before);
  assert.deepEqual(readFileSync(join(f.project, 'marketing/TASKS.md')), tasks);
  const missing = join(f.dir, 'absent.sqlite');
  assert.equal(run(['--database', missing]).status, 0);
  assert.equal(existsSync(missing), false);
  assert.equal(run([]).status, 1);
});

test('shared workflow routes the daily brief, and its entrypoints and links resolve', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  const route = workflow.split('\n').find(line => line.startsWith('- **"Give me my daily brief"'));
  assert.ok(route, 'Daily brief route missing');
  assert.match(route, /queues, completes and posts nothing/);
  assert.ok(links('templates/WORKFLOW.md').includes(procedure));
  const text = readFileSync(procedure, 'utf8');
  for (const rule of ['It does not queue, complete, snooze, skip, record or post anything', '`--since`',
    'On a Monday', '## 5. Report', 'recorded as done', 'Do not read other files, product repositories or web pages'])
    assert.ok(text.includes(rule), `Brief procedure lacks: ${rule}`);
  for (const file of [procedure, resolve('.claude/commands/promote-brief.md'), resolve('.claude/skills/promotion-brief/SKILL.md')])
    for (const link of links(file)) assert.ok(existsSync(link), `Missing linked resource from ${file}: ${link}`);
  assert.match(readFileSync('.agents/skills/promotion-brief/agents/openai.yaml', 'utf8'), /\$promotion-brief/);
  assert.ok(existsSync('dist/templates/brief/WORKFLOW.md'), 'Built bundle lacks the brief procedure');
});
