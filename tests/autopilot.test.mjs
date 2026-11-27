import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { claimDirect, claimIdeation, claimTask, coverage, parseAgent, releaseLease, renewLease, showSettings, updateSettings, workSummary } from '../src/interactive/autopilot.ts';
import { promotionBrief } from '../src/interactive/brief.ts';
import { inspectProject, recordTaskEvidence, setSelectedTaskDisposition } from '../src/interactive/tasks.ts';
import { observerSource } from '../src/onboarding/workspace.ts';

const links = file => [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
  .filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));

function workspace(dir, name, id, tasks) {
  const project = join(dir, name);
  cpSync('examples/example-desk', project, { recursive: true });
  const config = JSON.parse(readFileSync(join(project, 'promotion-agent.json'), 'utf8'));
  writeFileSync(join(project, 'promotion-agent.json'), JSON.stringify({ ...config, id, displayName: name }, null, 2));
  const observed = join(dir, `${name}-source`);
  mkdirSync(observed);
  writeFileSync(join(project, 'promotion-source.json'), JSON.stringify(observerSource(project, observed)));
  writeFileSync(join(project, 'marketing/TASKS.md'), `# Marketing tasks — ${name}\n\n## Open\n\n${tasks}\n## Done\n\n- [x] T-001 | 2026-09-20 | P2 | social | Published post\n      Materials: Done.\n`);
  mkdirSync(join(project, 'marketing/drafts'), { recursive: true });
  mkdirSync(join(project, 'marketing/handoffs'), { recursive: true });
  return project;
}

function fileTask(project, id, title, category, materials, date = '2026-11-27') {
  const file = join(project, 'marketing/TASKS.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace('## Done', `- [ ] ${id} | ${date} | P2 | ${category} | ${title}\n      Materials: ${materials}\n\n## Done`));
}

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-autopilot-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const alpha = workspace(dir, 'Alpha', '11111111-1111-4111-8111-111111111111', `- [ ] T-002 | 2026-09-21 | P1 | competitor | Research competitors
      Materials: CMO idea 2026-09-21. Compare three competitors.

- [ ] T-003 | 2026-09-22 | P2 | directory | Submit the kit
      Materials: Human required: submit the form signed in as the owner.

- [ ] T-004 | 2026-09-22 | P1 | product | Add a pricing FAQ
      Materials: Product change.

- [ ] T-005 | 2026-09-22 | P3 | social | Draft a thread
      Materials: Two drafts.

- [ ] T-006 | 2026-09-22 | P2 | blog | Skipped idea
      Materials: CMO idea 2026-09-22. Not wanted.
`);
  const beta = workspace(dir, 'Beta', '22222222-2222-4222-8222-222222222222', `- [ ] T-002 | 2026-09-23 | P2 | engagement | Reply to threads
      Materials: Find two threads.
`);
  const database = join(dir, 'portfolio.sqlite');
  const hashA = inspectProject(alpha).snapshot.hash;
  setSelectedTaskDisposition(alpha, 'T-006', hashA, database, 'skipped', 'Not our audience', null);
  setSelectedTaskDisposition(beta, 'T-002', inspectProject(beta).snapshot.hash, database, 'active', null, null);
  return { dir, alpha, beta, database, hashA };
}

test('settings default to standard, change per portfolio and product, and reject bad values', t => {
  const f = fixture(t);
  assert.equal(showSettings(f.database).portfolio.name, 'standard');
  assert.equal(existsSync(`${f.database}.autopilot/settings.json`), false, 'showing settings writes nothing');
  updateSettings(f.database, '11111111-1111-4111-8111-111111111111', { level: 3 });
  const changed = updateSettings(f.database, null, { limits: { maxTasksPerRun: 7 } });
  assert.equal(changed.portfolio.limits.maxTasksPerRun, 7);
  assert.equal(changed.projects['11111111-1111-4111-8111-111111111111'].name, 'aggressive');
  assert.throws(() => updateSettings(f.database, null, { level: 4 }), /level must be 0, 1, 2 or 3/);
  assert.throws(() => updateSettings(f.database, null, { limits: { bogus: 1 } }), /unknown limit/);
  assert.equal(updateSettings(f.database, '11111111-1111-4111-8111-111111111111', { reset: true }).projects['11111111-1111-4111-8111-111111111111'], undefined);
});

test('claims take the highest priority allowed task, one lease per product, and respect the level', t => {
  const f = fixture(t);
  const first = claimTask(f.database, 'claude-run-a');
  // P1 product task is excluded at standard; P1 competitor research wins.
  assert.equal(first.claim.project.displayName, 'Alpha');
  assert.equal(first.claim.task.taskId, 'T-002');
  assert.equal(first.claim.mode, 'work');
  assert.match(first.claim.prompt, /Research competitors/);
  assert.match(first.claim.level.neverAllowed, /never spend money/);
  // A second session cannot work Alpha at the same time, so it gets Beta.
  const second = claimTask(f.database, 'claude-run-b');
  assert.equal(second.claim.project.displayName, 'Beta');
  const third = claimTask(f.database, 'claude-run-c');
  assert.equal(third.claim, null);
  assert.match(third.reason, /held by another session/);
  assert.ok(third.passedOver.some(p => p.taskId === 'T-004' && /excluded/.test(p.reason)));
  assert.throws(() => releaseLease(f.database, first.claim.leaseId, 'claude-run-a', 'completed'), /still open/);
  assert.throws(() => releaseLease(f.database, first.claim.leaseId, 'claude-run-b', 'failed', 'x'), /another agent/);
  assert.throws(() => releaseLease(f.database, first.claim.leaseId, 'claude-run-a', 'failed'), /needs --note/);
  assert.equal(releaseLease(f.database, first.claim.leaseId, 'claude-run-a', 'failed', 'Search was blocked').released, true);
  assert.throws(() => releaseLease(f.database, first.claim.leaseId, 'claude-run-a', 'failed', 'again'), /Lease not held/);
  // The human-required directory task is next for Alpha, as a handoff to prepare.
  const fourth = claimTask(f.database, 'claude-run-a');
  assert.equal(fourth.claim.task.taskId, 'T-002', 'a failed task is retried once');
  releaseLease(f.database, fourth.claim.leaseId, 'claude-run-a', 'failed', 'Blocked again');
  const fifth = claimTask(f.database, 'claude-run-d');
  assert.equal(fifth.claim.task.taskId, 'T-003');
  assert.equal(fifth.claim.mode, 'handoff');
  releaseLease(f.database, fifth.claim.leaseId, 'claude-run-d', 'failed', 'Not now');
  const sixth = claimTask(f.database, 'claude-run-f');
  assert.equal(sixth.claim, null, 'Alpha hit its daily limit of three claims; Beta is still leased');
  assert.ok(sixth.passedOver.some(p => /3 claims in 24 hours/.test(p.reason)));
  // Raising the level opens product tasks; the twice-failed task is now stuck.
  updateSettings(f.database, '11111111-1111-4111-8111-111111111111', { level: 3 });
  const aggressive = claimTask(f.database, 'claude-run-e');
  assert.equal(aggressive.claim.task.taskId, 'T-004');
  assert.equal(aggressive.claim.level.name, 'aggressive');
});

test('handoff claims need a handoff record, and the brief then shows it as waiting on the user', t => {
  const f = fixture(t);
  updateSettings(f.database, null, { limits: { maxPriority: 2, excludeCategories: ['product', 'competitor'] } });
  const claim = claimTask(f.database, 'claude-run-h', [f.alpha]).claim;
  assert.equal(claim.task.taskId, 'T-003');
  assert.equal(claim.mode, 'handoff');
  assert.match(claim.modeInstructions, /marketing\/handoffs/);
  writeFileSync(join(f.alpha, 'marketing/drafts/kit.md'), 'Kit');
  writeFileSync(join(f.alpha, 'marketing/handoffs/T-003.md'), '# Submit the kit\n');
  recordTaskEvidence(f.alpha, 'T-003', f.hashA, 'draft', 'marketing/drafts/kit.md', 'Kit drafted');
  const wait = Date.now() + 5; while (Date.now() < wait); // keep the two records' timestamps distinct
  assert.throws(() => releaseLease(f.database, claim.leaseId, 'claude-run-h', 'handoff'), /must reference marketing\/handoffs/);
  recordTaskEvidence(f.alpha, 'T-003', f.hashA, 'draft', 'marketing/handoffs/T-003.md', 'Human handoff: submit the kit');
  assert.equal(releaseLease(f.database, claim.leaseId, 'claude-run-h', 'handoff').outcome, 'handoff');
  const brief = promotionBrief([f.alpha], f.database);
  const item = brief.projects[0].needsYou.find(i => i.taskId === 'T-003');
  assert.match(item.note, /^Handoff ready .*marketing\/handoffs\/T-003\.md/);
  assert.equal(claimTask(f.database, 'claude-run-i', [f.alpha]).claim, null, 'a handoff waiting on the user is not claimed again');
});

test('renew extends a lease, and an expired lease is taken over and counted', t => {
  const f = fixture(t);
  const start = new Date('2026-11-26T10:00:00.000Z');
  const claim = claimTask(f.database, 'claude-run-r', [f.beta], start).claim;
  const renewed = renewLease(f.database, claim.leaseId, 'claude-run-r', new Date('2026-11-26T11:00:00.000Z'));
  assert.equal(renewed.expiresAt, '2026-11-26T13:00:00.000Z');
  assert.equal(claimTask(f.database, 'claude-run-s', [f.beta], new Date('2026-11-26T12:00:00.000Z')).claim, null);
  const later = claimTask(f.database, 'claude-run-s', [f.beta], new Date('2026-11-26T14:00:00.000Z'));
  assert.equal(later.claim.task.taskId, 'T-002');
  assert.throws(() => renewLease(f.database, claim.leaseId, 'claude-run-r'), /Lease not held/);
  const history = readFileSync(`${f.database}.autopilot/history.jsonl`, 'utf8');
  assert.match(history, /"event":"expired"/);
});

test('the run limit stops a session, and level 0 claims nothing', t => {
  const f = fixture(t);
  updateSettings(f.database, null, { limits: { maxTasksPerRun: 1 } });
  const one = claimTask(f.database, 'claude-run-x');
  assert.equal(one.runLimit.used, 1);
  const two = claimTask(f.database, 'claude-run-x');
  assert.equal(two.claim, null);
  assert.match(two.reason, /claimed 1 of 1/);
  updateSettings(f.database, null, { level: 0 });
  const off = claimTask(f.database, 'claude-run-y');
  assert.equal(off.claim, null);
  assert.match(off.reason, /off/);
});

test('coverage reports activities, skipped ideas and the ideation budget; ideation leases block runners', t => {
  const f = fixture(t);
  const report = coverage(f.database);
  const alpha = report.projects.find(p => p.project.displayName === 'Alpha');
  assert.deepEqual(alpha.cmoIdeas, { open: 1, done: 0, skipped: 1 });
  assert.deepEqual(alpha.skipped, [{ taskId: 'T-006', category: 'blog', title: 'Skipped idea', reason: 'Not our audience' }]);
  assert.ok(alpha.neverTried.includes('visibility'));
  assert.ok(!alpha.neverTried.includes('competitor'));
  assert.equal(alpha.ideation.eligible, true);
  assert.equal(alpha.ideation.budget, 3);
  assert.ok(alpha.openTasks.some(o => o.taskId === 'T-004' && /not at this level/.test(o.state)));
  const idea = claimIdeation(f.database, 'claude-cmo-1', [f.alpha]);
  assert.equal(idea.claim.coverage.project.displayName, 'Alpha');
  assert.equal(claimTask(f.database, 'claude-run-z', [f.alpha]).claim, null, 'runners wait while the CMO writes tasks');
  assert.throws(() => releaseLease(f.database, idea.claim.leaseId, 'claude-cmo-1', 'completed'), /ideas, none, failed/);
  assert.throws(() => releaseLease(f.database, idea.claim.leaseId, 'claude-cmo-1', 'ideas', 'Filed ideas'), /needs --filed/);
  fileTask(f.alpha, 'T-007', 'Measure AI visibility', 'visibility', 'CMO idea 2026-11-27. Never tried.');
  assert.throws(() => releaseLease(f.database, idea.claim.leaseId, 'claude-cmo-1', 'ideas', undefined, new Date(), ['T-099']), /not in Alpha's task list/);
  assert.deepEqual(releaseLease(f.database, idea.claim.leaseId, 'claude-cmo-1', 'ideas', undefined, new Date(), ['T-007']).filed, ['T-007']);
  assert.ok(coverage(f.database).projects.find(p => p.project.displayName === 'Alpha').autopilot.lastIdeation);
  updateSettings(f.database, null, { limits: { maxOpenTasks: 2 } });
  const full = claimIdeation(f.database, 'claude-cmo-2', [f.alpha]);
  assert.equal(full.claim, null);
  assert.match(full.notEligible[0].reason, /work the queue first/);
});

test('CLI commands run through the helper and require an existing registry', t => {
  const f = fixture(t);
  const run = args => spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/promotion.mjs', ...args], { encoding: 'utf8' });
  const set = run(['autopilot-settings', '--database', f.database, '--project', f.beta, '--level', '1']);
  assert.equal(set.status, 0, set.stderr);
  assert.equal(JSON.parse(set.stdout).projects['22222222-2222-4222-8222-222222222222'].name, 'cautious');
  const claim = run(['claim', '--database', f.database, '--agent', 'codex-run-cli', '--project', f.alpha]);
  assert.equal(claim.status, 0, claim.stderr);
  const lease = JSON.parse(claim.stdout).claim.leaseId;
  const release = run(['release', '--database', f.database, '--lease', lease, '--agent', 'codex-run-cli', '--outcome', 'failed', '--note', 'test']);
  assert.equal(release.status, 0, release.stderr);
  const missing = run(['coverage', '--database', join(f.dir, 'absent.sqlite')]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /needs the portfolio registry/);
  assert.equal(existsSync(join(f.dir, 'absent.sqlite')), false);
  assert.equal(run(['claim', '--database', f.database, '--agent', 'bad name']).status, 1);
  const direct = run(['claim', '--database', f.database, '--agent', 'codex-task-cli', '--project', f.beta, '--task', 'T-002', '--trigger', 'manual']);
  assert.equal(direct.status, 0, direct.stderr);
  const directLease = JSON.parse(direct.stdout).claim.leaseId;
  fileTask(f.beta, 'T-003', 'Reply to the second thread', 'engagement', 'Follow-up to T-002.');
  const filed = run(['release', '--database', f.database, '--lease', directLease, '--agent', 'codex-task-cli', '--outcome', 'failed', '--note', 'test', '--filed', 'T-003']);
  assert.equal(filed.status, 0, filed.stderr);
  assert.deepEqual(JSON.parse(filed.stdout).filed, ['T-003']);
  const summary = run(['work-summary', '--database', f.database]);
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(JSON.parse(summary.stdout).totals.claims, 2);
  assert.equal(run(['claim', '--database', f.database, '--agent', 'codex-task-cli', '--task', 'T-002']).status, 1, '--task needs --project');
});

test('agent names carry the agent and the kind of run, so Claude and Codex runs never share one', t => {
  const f = fixture(t);
  assert.deepEqual(parseAgent('codex-run-2026-11-30T1400Z-k3'), { host: 'codex', kind: 'run' });
  assert.equal(parseAgent('run-2026-11-30T1400Z-k3'), null);
  assert.throws(() => claimTask(f.database, 'run-2026-11-30T1400Z-k3'), /<agent>-run-<unique part>/);
  assert.throws(() => claimTask(f.database, 'Claude-run-1'), /<agent>-run-/);
  assert.throws(() => claimTask(f.database, 'claude-cmo-1'), /kind "run"/);
  assert.throws(() => claimIdeation(f.database, 'claude-run-1'), /kind "cmo"/);
  assert.throws(() => claimDirect(f.database, 'claude-run-1', f.alpha, 'T-002'), /kind "task"/);
  assert.throws(() => claimTask(f.database, 'claude-run-1', [], new Date(), 'cron'), /scheduled or manual/);
  // Claude and Codex run at the same time under the same suffix: two names, two runs, two products.
  const claude = claimTask(f.database, 'claude-run-2026-11-30T1400Z-k3', [], new Date(), 'scheduled');
  const codex = claimTask(f.database, 'codex-run-2026-11-30T1400Z-k3', [], new Date(), 'scheduled');
  assert.notEqual(claude.claim.project.id, codex.claim.project.id);
  assert.throws(() => releaseLease(f.database, claude.claim.leaseId, 'codex-run-2026-11-30T1400Z-k3', 'failed', 'x'), /another agent/);
});

test('a session can claim the one task the user asked for, outside the level and limits, and runners keep out', t => {
  const f = fixture(t);
  updateSettings(f.database, null, { limits: { perProjectPerDay: 1 } });
  // T-004 is a product task, above standard; the user asked for it, so the level does not apply.
  const direct = claimDirect(f.database, 'claude-task-1', f.alpha, 'T-004');
  assert.equal(direct.claim.task.taskId, 'T-004');
  assert.equal(direct.claim.level.name, 'user request');
  assert.match(direct.claim.level.neverAllowed, /never spend money/);
  const blocked = claimDirect(f.database, 'codex-task-2', f.alpha, 'T-005');
  assert.equal(blocked.claim, null);
  assert.match(blocked.reason, /being worked by claude-task-1 \(T-004\)/);
  assert.equal(claimTask(f.database, 'codex-run-1', [f.alpha]).claim, null, 'runners keep out while the session works');
  assert.throws(() => releaseLease(f.database, direct.claim.leaseId, 'claude-task-1', 'stopped'), /needs --note/);
  assert.equal(releaseLease(f.database, direct.claim.leaseId, 'claude-task-1', 'stopped', 'User moved on').outcome, 'stopped');
  const queued = claimTask(f.database, 'codex-run-3', [f.beta]).claim;
  assert.throws(() => releaseLease(f.database, queued.leaseId, 'codex-run-3', 'stopped', 'x'), /must be one of: completed/, 'only one-task leases may stop');
  releaseLease(f.database, queued.leaseId, 'codex-run-3', 'failed', 'x');
  assert.equal(claimTask(f.database, 'codex-run-2', [f.alpha]).claim.task.taskId, 'T-002', 'a direct claim uses none of the daily limit');
  assert.throws(() => claimDirect(f.database, 'claude-task-3', f.beta, 'T-001'), /already done/);
  assert.throws(() => claimDirect(f.database, 'claude-task-3', f.beta, 'T-009'), /not in this workspace/);
});

test('the work summary shows every run, its outcomes, records and filed tasks, and work outside any lease', t => {
  const f = fixture(t);
  const now = new Date();
  // A scheduled Claude runner finishes a draft on Alpha and files a follow-up.
  const run = claimTask(f.database, 'claude-run-2026-11-27T0900Z-a1', [], now, 'scheduled');
  assert.equal(run.claim.project.displayName, 'Alpha');
  writeFileSync(join(f.alpha, 'marketing/drafts/competitors.md'), 'Table');
  recordTaskEvidence(f.alpha, 'T-002', f.hashA, 'draft', 'marketing/drafts/competitors.md', 'Competitor table drafted');
  fileTask(f.alpha, 'T-007', 'Reply where competitors are discussed', 'engagement', 'Follow-up to T-002.');
  releaseLease(f.database, run.claim.leaseId, 'claude-run-2026-11-27T0900Z-a1', 'draft', undefined, new Date(), ['T-007']);
  // A scheduled Codex runner fails on Beta, then finds nothing else.
  const codex = claimTask(f.database, 'codex-run-2026-11-27T0900Z-b2', [], new Date(), 'scheduled');
  assert.equal(codex.claim.project.displayName, 'Beta');
  releaseLease(f.database, codex.claim.leaseId, 'codex-run-2026-11-27T0900Z-b2', 'failed', 'Reddit search blocked');
  updateSettings(f.database, '22222222-2222-4222-8222-222222222222', { level: 0 });
  // A manual one-task session is still working on Alpha.
  claimDirect(f.database, 'claude-task-2026-11-27T1000Z-c3', f.alpha, 'T-005');
  assert.equal(claimTask(f.database, 'codex-run-2026-11-27T0900Z-b2').claim, null);
  // Someone recorded work on Beta without claiming it.
  const hashB = inspectProject(f.beta).snapshot.hash;
  writeFileSync(join(f.beta, 'marketing/drafts/replies.md'), 'Replies');
  recordTaskEvidence(f.beta, 'T-002', hashB, 'draft', 'marketing/drafts/replies.md', 'Two replies drafted by hand');

  const s = workSummary(f.database);
  assert.equal(s.totals.runs, 3);
  assert.equal(s.totals.claims, 3);
  assert.equal(s.totals.drafts, 1);
  assert.equal(s.totals.failed, 1);
  assert.equal(s.totals.inProgress, 1);
  assert.equal(s.totals.recordsOutsideLeases, 1);
  const claudeRun = s.runs.find(r => r.agent.startsWith('claude-run'));
  assert.deepEqual([claudeRun.host, claudeRun.kind, claudeRun.trigger, claudeRun.claims, claudeRun.filed], ['claude', 'run', 'scheduled', 1, 1]);
  const codexRun = s.runs.find(r => r.host === 'codex');
  assert.match(codexRun.stopped, /held by another session|Nothing claimable/);
  assert.equal(s.runs.find(r => r.kind === 'task').trigger, 'manual');
  const alpha = s.projects.find(p => p.project.displayName === 'Alpha');
  const draft = alpha.work.find(w => w.taskId === 'T-002');
  assert.equal(draft.outcome, 'draft');
  assert.equal(draft.records[0].reference, 'marketing/drafts/competitors.md');
  assert.deepEqual(draft.filed, ['T-007']);
  assert.equal(alpha.work.find(w => w.taskId === 'T-005').outcome, 'in progress');
  assert.equal(alpha.filed.find(x => x.taskId === 'T-007').by, 'claude-run-2026-11-27T0900Z-a1');
  const beta = s.projects.find(p => p.project.displayName === 'Beta');
  assert.equal(beta.work[0].note, 'Reddit search blocked');
  assert.equal(beta.otherRecords[0].summary, 'Two replies drafted by hand');
  assert.throws(() => workSummary(f.database, [], new Date(Date.now() + 60_000).toISOString(), now), /--since must be a past/);
  assert.equal(workSummary(f.database, [f.beta]).projects.length, 1, '--project limits the summary to one product');
});

test('CMO and runner procedures are routed, linked and mirrored as checkout skills', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  assert.match(workflow, /\[the CMO review\]\(autopilot\/CMO\.md\)/);
  assert.match(workflow, /\[the autopilot runner\]\(autopilot\/RUNNER\.md\)/);
  for (const file of ['templates/autopilot/CMO.md', 'templates/autopilot/RUNNER.md', 'docs/AUTOPILOT.md',
    '.claude/skills/promotion-cmo/SKILL.md', '.claude/skills/promotion-autopilot/SKILL.md',
    '.claude/commands/promote-cmo.md', '.claude/commands/promote-autopilot.md'])
    for (const link of links(file)) assert.ok(existsSync(link), `${file}: ${link}`);
  const cmo = readFileSync('templates/autopilot/CMO.md', 'utf8');
  for (const rule of [/CMO idea YYYY-MM-DD/, /claim --database .* --purpose ideation/, /neverTried/, /Try something new/, /skipped/, /Human required:/, /release .*--outcome ideas/])
    assert.match(cmo, rule);
  const runner = readFileSync('templates/autopilot/RUNNER.md', 'utf8');
  for (const rule of [/marketing\/handoffs\/T-NNN\.md/, /--outcome handoff/, /renew/, /Paste this into an agent in the promotion workspace/, /claude-run-/, /codex-run-/, /--trigger scheduled/, /--filed/, /neverAllowed/])
    assert.match(runner, rule);
  for (const rule of [/claude-cmo-/, /codex-cmo-/, /--filed T-012,T-013/]) assert.match(cmo, rule);
  assert.match(workflow, /\[the work summary\]\(autopilot\/SUMMARY\.md\)/);
  assert.match(workflow, /--task T-NNN --agent <agent>-task-/);
  const summary = readFileSync('templates/autopilot/SUMMARY.md', 'utf8');
  for (const rule of [/work-summary --database/, /scheduled/, /otherRecords/, /stopped/, /Change|changes nothing|read only/i]) assert.match(summary, rule);
  for (const file of ['templates/autopilot/SUMMARY.md', '.claude/skills/promotion-brief/SKILL.md', '.claude/commands/promote-brief.md'])
    for (const link of links(file)) assert.ok(existsSync(link), `${file}: ${link}`);
  for (const skill of ['promotion-cmo', 'promotion-autopilot', 'promotion-brief'])
    assert.equal(readFileSync(`.agents/skills/${skill}/SKILL.md`, 'utf8'), readFileSync(`.claude/skills/${skill}/SKILL.md`, 'utf8'), `${skill} mirrored`);
  assert.match(readFileSync('docs/AUTOPILOT.md', 'utf8'), /Daily work summary/);
  assert.ok(existsSync('.agents/skills/promotion-cmo/agents/openai.yaml'));
  assert.ok(existsSync('.agents/skills/promotion-autopilot/agents/openai.yaml'));
});
