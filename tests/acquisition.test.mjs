import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { acquisitionUrl, acquisitionSprintSchema, acquisitionProgress, acquisitionStatus } from '../src/interactive/acquisition.ts';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';
import { inspectProject, prepareTask, recordTaskEvidence, completeSelectedTask, setSelectedTaskDisposition } from '../src/interactive/tasks.ts';
import { promptCategory } from '../src/core/task-prompt.ts';
import { reviewData } from '../src/review/data.ts';

const at = '2026-10-13T14:00:00.000Z';
const later = '2026-10-14T14:00:00.000Z';
function links(file) { return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, p]) => resolve(dirname(file), p)); }
function snapshot(dir) { return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
  ? Object.entries(snapshot(join(dir, e.name))).map(([p, bytes]) => [`${e.name}/${p}`, bytes])
  : [[e.name, readFileSync(join(dir, e.name)).toString('base64')]])); }
function assessment(score = 2, minutes = 15) {
  const rating = { score, reason: 'Synthetic fixture evidence supports this rating; not live research.' };
  return { checkedAt: at, evidence: 'Synthetic discussion snapshot', basis: 'verified', publishedAt: at,
    audienceFit: { ...rating }, statedProblem: { ...rating }, recency: { ...rating }, contribution: { ...rating },
    decision: 'candidate', reason: 'A specific helpful answer is possible in this fictional discussion.', estimatedMinutes: minutes };
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-acquisition-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source'), workspace = join(root, 'workspace'), database = join(root, 'state.sqlite');
  mkdirSync(source); mkdirSync(workspace);
  writeFileSync(join(source, 'README.md'), '# Fictional Team Desk\nOrganize team reference notes.\n');
  const plan = previewInstall(workspace, 'Fictional Team Desk', source);
  applyInstall(workspace, plan, reviewHash(plan));
  const sprint = JSON.parse(readFileSync('templates/activities/acquisition/SPRINT.json'));
  sprint.id = randomUUID(); sprint.projectId = inspectProject(workspace).project.id;
  sprint.audience = 'Fictional small teams organizing reference notes';
  sprint.offer = 'Fictional paid note workspace, terms require founder review';
  sprint.offerSource = 'Synthetic product brief';
  sprint.customerDefinition = 'Distinct accounts with a successful non-refunded first payment; exclude free/trial/test accounts and repeated purchases.';
  sprint.baseline.payingCustomers = { count: 0, basis: 'verified', reference: 'Synthetic zero-payment baseline' };
  const opp = (name, score = 2, minutes = 15) => ({ id: randomUUID(), url: `https://community.example/threads/${name}`, history: [assessment(score, minutes)], taskIds: [] });
  sprint.opportunities = [opp('first'), opp('second'), opp('third', 1), opp('fourth', 1)];
  const dir = `marketing/acquisition/${sprint.id}`;
  mkdirSync(join(workspace, dir, 'versions'), { recursive: true });
  const path = join(workspace, dir, 'SPRINT.json');
  const save = () => writeFileSync(path, JSON.stringify(sprint, null, 2) + '\n');
  save();
  const tasks = '# Tasks\n\n## Open\n\n- [ ] T-001 | 2026-10-13 | P1 | acquisition | Review a helpful reply\n      URL: https://community.example/threads/first\n      Materials: Synthetic unsent reply; estimate 15 minutes.\n\n- [ ] T-002 | 2026-10-13 | P2 | outreach | Review another question\n      URL: https://community.example/threads/second\n      Materials: Synthetic unsent question; estimate 15 minutes.\n\n- [ ] T-003 | 2026-10-13 | P2 | competitor | Prepare the research report\n      Materials: Research completion is separate from the customer target.\n\n## Done\n';
  writeFileSync(join(workspace, 'marketing/TASKS.md'), tasks);
  return { root, source, workspace, database, sprint, path, dir, save, tasks };
}

test('opportunity canonicalization deduplicates thread/comment/tracking aliases without merging distinct targets', () => {
  assert.equal(acquisitionUrl('https://old.reddit.com/r/example/comments/abc123/topic/def456/?utm_source=x#reply'), 'https://www.reddit.com/comments/abc123');
  assert.equal(acquisitionUrl('https://www.reddit.com/comments/abc123'), 'https://www.reddit.com/comments/abc123');
  assert.equal(acquisitionUrl('https://twitter.com/OldHandle/status/12345?s=20#reply'), 'https://x.com/i/status/12345');
  assert.equal(acquisitionUrl('https://x.com/NewHandle/status/12345'), 'https://x.com/i/status/12345');
  assert.equal(acquisitionUrl('https://community.example/thread/?utm_source=x&b=2&a=1#reply'), 'https://community.example/thread?a=1&b=2');
  assert.notEqual(acquisitionUrl('https://news.ycombinator.com/item?id=1'), acquisitionUrl('https://news.ycombinator.com/item?id=2'));
  assert.throws(() => acquisitionUrl('https://user:password@example.com/thread'), /credentials/);
  assert.throws(() => acquisitionUrl('https://community.example/thread?token=private'), /credential or signed-link/);
});

test('sprint schema rejects duplicate identity, unknown-as-zero, unrelated events and secret fields', t => {
  const f = fixture(t);
  assert.equal(acquisitionSprintSchema.parse(f.sprint).target.payingCustomers, 10);
  const change = fn => { const s = structuredClone(f.sprint); fn(s); return s; };
  assert.throws(() => acquisitionSprintSchema.parse(change(s => s.opportunities.push({ ...s.opportunities[0], id: randomUUID(), url: s.opportunities[0].url + '?utm_source=other#reply' }))), /duplicate opportunity/);
  assert.throws(() => acquisitionSprintSchema.parse(change(s => s.baseline.trialUsers.count = 0)), /unknown is not zero/);
  assert.throws(() => acquisitionSprintSchema.parse(change(s => s.apiKey = 'not-allowed')), /unknown field/);
  assert.throws(() => acquisitionSprintSchema.parse(change(s => s.actions.push({ id: randomUUID(), opportunityId: randomUUID(), taskId: 'T-001', kind: 'reply', basis: 'reported', reference: 'Founder update', at }))), /linkage/);
  assert.throws(() => acquisitionSprintSchema.parse(change(s => s.opportunities[0].taskIds = ['T-001', 'T-001'])), /unique task/);
});

test('paying, trials, signups and reported outcomes stay separate; repeat reports, confirmation and retraction are not summed', t => {
  const { sprint } = fixture(t);
  const event = (customerKey, kind, basis = 'reported', date = at) => ({ id: randomUUID(), customerKey, kind, basis, reference: 'Synthetic attributed evidence', at: date,
    opportunityId: null, actionId: null, newSinceBaseline: true, note: 'Fictional evidence; no payment provider was accessed.' });
  sprint.outcomes = [event('unit-a', 'trial-user'), event('unit-a', 'signup'), event('unit-a', 'paying-customer'), event('unit-a', 'paying-customer'), event('unit-b', 'paying-customer', 'verified')];
  let p = acquisitionProgress(acquisitionSprintSchema.parse(sprint));
  assert.equal(p.payingCustomers.verifiedTotal, 1);
  assert.equal(p.payingCustomers.reportedNew, 1);
  assert.equal(p.payingCustomers.knownOrReportedTotal, 2);
  assert.equal(p.trialUsers.reportedNew, 1);
  assert.equal(p.signups.reportedNew, 1);
  assert.equal(p.verifiedTargetMet, false);
  sprint.outcomes.push(event('unit-a', 'paying-customer', 'verified', later));
  p = acquisitionProgress(acquisitionSprintSchema.parse(sprint));
  assert.equal(p.payingCustomers.verifiedTotal, 2);
  assert.equal(p.payingCustomers.reportedNew, 0);
  sprint.outcomes.push(event('unit-b', 'paying-customer', 'retracted', later));
  assert.equal(acquisitionProgress(acquisitionSprintSchema.parse(sprint)).payingCustomers.verifiedTotal, 1);
  sprint.baseline.payingCustomers = { count: null, basis: 'unknown', reference: null };
  assert.equal(acquisitionProgress(acquisitionSprintSchema.parse(sprint)).payingCustomers.verifiedTotal, null);
  sprint.target = { payingCustomers: 1, mode: 'additional' };
  assert.equal(acquisitionProgress(acquisitionSprintSchema.parse(sprint)).verifiedTargetMet, true);
  sprint.target = { payingCustomers: 10, mode: 'additional' };
  for (let i = 0; i < 10; i++) sprint.outcomes.push(event(`reported-${i}`, 'paying-customer'));
  p = acquisitionProgress(acquisitionSprintSchema.parse(sprint));
  assert.equal(p.reportedTargetMet, true);
  assert.equal(p.verifiedTargetMet, false);
});

test('status resumes saved identity/history across processes and relocation with budgeted suggestions, no source writes or sending', t => {
  const f = fixture(t);
  const sourceBefore = snapshot(f.source), tasksBefore = readFileSync(join(f.workspace, 'marketing/TASKS.md'));
  const first = acquisitionStatus(f.workspace, f.sprint.id);
  assert.equal(first.today.length, 2);
  assert.equal(first.remainingMinutes, 0);
  assert.equal(first.shortlist.length, 4);
  assert.deepEqual(first.today.map(o => o.selectedTaskId).sort(), ['T-001', 'T-002']);
  assert.ok(first.warnings.some(w => w.includes('No registry selected')));
  const run = workspace => JSON.parse(execFileSync(process.execPath, ['dist/scripts/promotion.mjs', 'acquisition-status', '--project', workspace, '--sprint', f.sprint.id], { encoding: 'utf8' }));
  assert.equal(run(f.workspace).sprint.id, f.sprint.id);
  f.sprint.version = 2;
  f.sprint.reviews.push({ at: later, version: 2, evidence: 'Founder report: no reply sent', learned: 'Draft needed a more useful opening.', decision: 'Adapt opening; keep daily budget.' });
  f.save();
  const resumed = run(f.workspace);
  assert.equal(resumed.sprint.reviews.length, 1);
  assert.equal(resumed.sprint.version, 2);
  assert.equal(resumed.progress.payingCustomers.verifiedTotal, 0);
  const moved = join(f.root, 'moved'); renameSync(f.workspace, moved);
  const result = JSON.parse(execFileSync(process.execPath, [join(moved, '.promotion-agent/scripts/promotion.mjs'), 'acquisition-status', '--project', moved, '--sprint', f.sprint.id], { encoding: 'utf8' }));
  assert.equal(result.projectId, f.sprint.projectId);
  assert.equal(result.sprint.reviews[0].learned, resumed.sprint.reviews[0].learned);
  assert.deepEqual(readFileSync(join(moved, 'marketing/TASKS.md')), tasksBefore);
  assert.deepEqual(snapshot(f.source), sourceBefore);
  assert.deepEqual(result.sprint.actions, []);
  assert.deepEqual(result.sprint.outcomes, []);
});

test('a reported action awaiting verification is not suggested as another send, and weak/unverified candidates stay in the plan', t => {
  const f = fixture(t);
  f.sprint.actions.push({ id: randomUUID(), opportunityId: f.sprint.opportunities[0].id, taskId: 'T-001', kind: 'helpful reply', basis: 'reported', reference: 'Fictional founder update: reply sent, no receipt yet', at });
  f.sprint.opportunities[1].history[0].basis = 'unverified';
  f.sprint.opportunities[2].history[0].contribution.score = 0;
  f.save();
  const result = acquisitionStatus(f.workspace, f.sprint.id);
  assert.match(result.today.find(o=>o.selectedTaskId==='T-001').action, /Verify the recorded action.*do not resend/);
  assert.equal(result.progress.payingCustomers.verifiedTotal, 0);
  assert.ok(result.shortlist.find(o=>o.id===f.sprint.opportunities[1].id).blockedReason.includes('unverified'));
  assert.ok(result.shortlist.find(o=>o.id===f.sprint.opportunities[2].id).blockedReason.includes('unsupported'));
  assert.equal(readFileSync(join(f.workspace,'marketing/TASKS.md'),'utf8'), f.tasks);
});

test('today respects skipped/snoozed tasks and registry failures, and report completion never achieves the sprint', t => {
  const f = fixture(t);
  const revision = prepareTask(f.workspace, 'T-001').revision;
  setSelectedTaskDisposition(f.workspace, 'T-001', revision, f.database, 'skipped', 'Founder decided this conversation is a poor fit', null);
  setSelectedTaskDisposition(f.workspace, 'T-002', revision, f.database, 'snoozed', 'Wait for a response', '2099-10-13T14:00:00.000Z');
  // Task references are absent: canonical URL matching still honors earlier board dispositions.
  const before = readFileSync(f.database);
  let result = acquisitionStatus(f.workspace, f.sprint.id, f.database);
  assert.deepEqual(result.today.map(o => o.id), f.sprint.opportunities.slice(2).map(o => o.id).sort((a,b)=>a.localeCompare(b)));
  assert.ok(result.shortlist.slice(0,2).every(o => /skipped or snoozed/.test(o.blockedReason)));
  assert.deepEqual(readFileSync(f.database), before);
  assert.equal(acquisitionStatus(f.workspace, f.sprint.id, join(f.root, 'missing.sqlite')).today.length, 0);
  assert.equal(existsSync(join(f.root, 'missing.sqlite')), false);
  const corrupt = join(f.root, 'corrupt.sqlite');
  writeFileSync(corrupt, 'Synthetic corrupt registry');
  assert.deepEqual(acquisitionStatus(f.workspace, f.sprint.id, corrupt).today, []);
  assert.equal(readFileSync(corrupt, 'utf8'), 'Synthetic corrupt registry');
  mkdirSync(join(f.workspace, 'marketing/drafts'));
  writeFileSync(join(f.workspace, 'marketing/drafts/report.md'), 'Synthetic research report: ten threads; no customers and no replies sent.');
  const report = recordTaskEvidence(f.workspace, 'T-003', revision, 'verified-complete', 'marketing/drafts/report.md', 'Outputs: Synthetic research report checked.\nImpact: Expected better opportunity selection; no customer outcome.\nNext steps: Existing unsent reply tasks.');
  completeSelectedTask(f.workspace, 'T-003', revision, f.database, report.path, report.hash);
  result = acquisitionStatus(f.workspace, f.sprint.id, f.database);
  assert.equal(reviewData(f.workspace, f.database).tasks.find(t=>t.taskId==='T-003').status, 'done');
  assert.equal(result.progress.verifiedTargetMet, false);
  assert.equal(result.sprint.status, 'active');
  f.sprint.status = 'achieved'; f.save();
  assert.ok(acquisitionStatus(f.workspace, f.sprint.id, f.database).warnings.some(w => w.includes('verified customer target is not met')));
  assert.deepEqual(acquisitionStatus(f.workspace, f.sprint.id, f.database).today, []);
});

test('invalid boards/identity/symlinked records cannot select actions; routes and fallback retain approval and one-board rules', t => {
  const f = fixture(t);
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  assert.match(workflow, /"Help me find my first 10 paying customers.*activity `acquisition`/);
  assert.match(workflow, /"What should I do today\?".*resume its saved record/);
  assert.equal(promptCategory('acquisition'), 'acquisition');
  assert.equal(promptCategory('first-customers'), 'acquisition');
  const prepared = prepareTask(f.workspace, 'T-001');
  for (const phrase of ['unsent until explicitly authorized', 'reported from verified', 'existing TASKS.md', 'skipped', 'cannot complete the customer sprint']) assert.ok(prepared.prompt.includes(phrase), phrase);
  const procedure = 'templates/activities/acquisition/WORKFLOW.md';
  for (const file of [procedure, join(f.workspace, '.promotion-agent', procedure)]) for (const link of links(file)) assert.ok(existsSync(link), link);
  assert.equal(existsSync(join(f.workspace, f.dir, 'TASKS.md')), false);
  writeFileSync(join(f.workspace, 'marketing/TASKS.md'), 'broken task snapshot');
  assert.deepEqual(acquisitionStatus(f.workspace, f.sprint.id).today, []);
  f.sprint.projectId = randomUUID(); f.save();
  assert.throws(() => acquisitionStatus(f.workspace, f.sprint.id), /identity does not match/);
  rmSync(f.path); symlinkSync(join(f.source, 'README.md'), f.path);
  assert.throws(() => acquisitionStatus(f.workspace, f.sprint.id), /Symlink/);
});
