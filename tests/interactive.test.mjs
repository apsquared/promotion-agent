import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { inspectProject, prepareTask, recordTaskEvidence, completeSelectedTask, setSelectedTaskDisposition, readSelectedTaskState } from '../src/interactive/tasks.ts';
import { readEvidence } from '../src/interactive/evidence.ts';
import { Store } from '../src/storage/store.ts';
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-interactive-'));
  const project = join(dir, 'fictional product');
  cpSync(new URL('../examples/example-desk', import.meta.url), project, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, project, file: join(project, 'marketing/TASKS.md'), database: join(dir, 'local.sqlite') };
}
test('inspect and prepare preserve all source bytes and create no database or drafts', t => {
  const { project, file, dir } = setup(t);
  const before = readFileSync(file);
  const inspected = inspectProject(project);
  assert.equal(inspected.snapshot.classification, 'valid');
  const prepared = prepareTask(project, 'T-001');
  assert.equal(prepared.revision, inspected.snapshot.hash);
  assert.ok(prepared.prompt.includes(inspected.snapshot.tasks[0].materials));
  assert.ok(prepared.prompt.includes(inspected.snapshot.tasks[0].agentPrompt));
  assert.equal(prepared.context, inspected.context);
  assert.deepEqual(readFileSync(file), before);
  assert.deepEqual(readdirSync(dir), ['fictional product']);
});
test('old tasks without Prompt work; completed, unknown and invalid tasks fail closed', t => {
  const { project, file } = setup(t);
  assert.match(prepareTask(project, 'T-002').prompt, /thread as it stands/);
  assert.throws(() => prepareTask(project, 'T-003'), /completed/);
  assert.throws(() => prepareTask(project, 'T-999'), /not found/);
  writeFileSync(file, readFileSync(file, 'utf8').replace('## Done', '## Broken'));
  assert.equal(inspectProject(project).snapshot.classification, 'invalid');
  assert.throws(() => prepareTask(project, 'T-001'), /invalid/);
});
test('completion uses reviewed hash and preserves preferences and all unrelated task text', t => {
  const { project, file, database } = setup(t);
  const prepared = prepareTask(project, 'T-001');
  const before = readFileSync(file, 'utf8');
  const evidence = recordTaskEvidence(project, 'T-001', prepared.revision, 'verified-complete', 'https://directory.example/receipt', 'Fictional test receipt');
  const result = completeSelectedTask(project, 'T-001', prepared.revision, database, evidence.path, evidence.hash);
  assert.equal(result.status, 'done');
  assert.equal(result.evidence, evidence.path);
  assert.equal(readFileSync(file, 'utf8'), before.replace('- [ ] T-001', '- [x] T-001'));
  assert.throws(() => completeSelectedTask(project, 'T-002', prepared.revision, database, evidence.path, evidence.hash), /changed/);
  const store = new Store(database);
  const registered = store.getProject(prepared.projectId);
  store.registerProject(registered.project, { ...registered.local, preferredAgent: 'opencode' }); store.close();
  const second = prepareTask(project, 'T-002');
  const secondEvidence = recordTaskEvidence(project, 'T-002', second.revision, 'verified-complete', 'https://community.example/receipt', 'Fictional test receipt');
  completeSelectedTask(project, 'T-002', second.revision, database, secondEvidence.path, secondEvidence.hash);
  const reopened = new Store(database);
  assert.equal(reopened.getProject(prepared.projectId).local.preferredAgent, 'opencode'); reopened.close();
});
test('draft evidence needs no database; completion rejects draft, stale, foreign and changed evidence', t => {
  const { project, file, database, dir } = setup(t);
  const revision = prepareTask(project, 'T-001').revision;
  const before = readFileSync(file);
  const draft = recordTaskEvidence(project, 'T-001', revision, 'draft', 'public/logo.svg', 'Logo-backed draft prepared');
  assert.equal(readEvidence(project, draft.path).hash, draft.hash);
  assert.equal(readFileSync(file).compare(before), 0);
  assert.throws(() => readFileSync(database), /ENOENT/);
  assert.throws(() => completeSelectedTask(project, 'T-001', revision, database, draft.path, draft.hash), /evidence does not match/);
  assert.throws(() => completeSelectedTask(project, 'T-002', revision, database, draft.path, draft.hash), /evidence does not match/);
  const verified = recordTaskEvidence(project, 'T-001', revision, 'verified-complete', 'https://directory.example/receipt', 'Agent-verified fictional receipt');
  assert.throws(() => completeSelectedTask(project, 'T-001', revision, database, verified.path, draft.hash), /evidence does not match/);
  writeFileSync(join(project, 'public/logo.svg'), '<svg></svg>');
  assert.throws(() => readEvidence(project, draft.path), /reference changed/);
  assert.equal(readFileSync(file).compare(before), 0);
  assert.throws(() => recordTaskEvidence(project, 'T-001', revision, 'draft', 'https://example.com/?token=secret', 'unsafe URL'), /without credentials, query or fragment/);
  const outside = join(dir, 'outside.txt'); writeFileSync(outside, 'private fixture');
  symlinkSync(outside, join(project, 'public/outside.txt'));
  assert.throws(() => recordTaskEvidence(project, 'T-001', revision, 'draft', 'public/outside.txt', 'unsafe file'), /Symlink/);
});
test('skip, snooze and resume are optional local state and leave the task file untouched', t => {
  const { project, file, database } = setup(t);
  const before = readFileSync(file);
  const revision = prepareTask(project, 'T-001').revision;
  assert.equal(readSelectedTaskState(project, database).registry, 'absent');
  assert.throws(() => setSelectedTaskDisposition(project, 'T-001', revision, database, 'skipped', null, null), /reason is required/);
  const skipped = setSelectedTaskDisposition(project, 'T-001', revision, database, 'skipped', 'Already listed', null);
  assert.equal(skipped.state, 'skipped');
  assert.equal(readSelectedTaskState(project, database).tasks.find(t => t.taskId === 'T-001').disposition.reason, 'Already listed');
  const evidence = recordTaskEvidence(project, 'T-001', revision, 'verified-complete', 'https://directory.example/receipt', 'Fictional receipt');
  assert.throws(() => completeSelectedTask(project, 'T-001', revision, database, evidence.path, evidence.hash), /reactivate/);
  assert.throws(() => setSelectedTaskDisposition(project, 'T-001', revision, database, 'snoozed', 'Wait', '2020-01-01T00:00:00.000Z'), /future/);
  const snoozed = setSelectedTaskDisposition(project, 'T-001', revision, database, 'snoozed', 'Wait for listing', '2099-01-01T00:00:00.000Z');
  assert.equal(snoozed.until, '2099-01-01T00:00:00.000Z');
  const active = setSelectedTaskDisposition(project, 'T-001', revision, database, 'active', null, null);
  assert.equal(active.reason, null);
  assert.equal(readFileSync(file).compare(before), 0);
  writeFileSync(file, readFileSync(file, 'utf8').replace('## Done', '## Broken'));
  assert.throws(() => setSelectedTaskDisposition(project, 'T-002', revision, database, 'skipped', 'Invalid source', null), /invalid/);
  const store = new Store(database);
  assert.equal(store.listTasks(active.task.projectId).length, 4);
  store.close();
});
test('command works without any AI executable in PATH and rejects malformed options', t => {
  const { project, file, dir } = setup(t);
  const script = resolve('scripts/promotion.mjs');
  const run = args => spawnSync(process.execPath, ['--experimental-strip-types', script, ...args], { encoding: 'utf8', env: { ...process.env, PATH: dir } });
  const output = run(['prepare', '--project', project, '--task', 'T-001']);
  assert.equal(output.status, 0, output.stderr); assert.equal(JSON.parse(output.stdout).taskId, 'T-001');
  for (const args of [['launch', '--project', project], ['complete', '--project', project], ['inspect', '--project', project, '--project', project], ['inspect', '--project', project, '--model', 'invalid']]) assert.equal(run(args).status, 1);
  assert.match(readFileSync(file, 'utf8'), /- \[ \] T-001/);
});
test('CLI records evidence and disposition before guarded completion without launching an agent', t => {
  const { project, file, database, dir } = setup(t);
  const script = resolve('scripts/promotion.mjs');
  const run = args => {
    const output = spawnSync(process.execPath, ['--experimental-strip-types', script, ...args], { encoding: 'utf8', env: { ...process.env, PATH: dir } });
    assert.equal(output.status, 0, output.stderr);
    return JSON.parse(output.stdout);
  };
  const revision = run(['prepare', '--project', project, '--task', 'T-001']).revision;
  const draft = run(['record', '--project', project, '--task', 'T-001', '--expected-hash', revision,
    '--outcome', 'draft', '--reference', 'public/logo.svg', '--summary', 'Draft logo reviewed']);
  assert.equal(draft.record.outcome, 'draft');
  assert.equal(run(['state', '--project', project, '--database', database]).registry, 'absent');
  run(['disposition', '--project', project, '--task', 'T-001', '--expected-hash', revision,
    '--database', database, '--state', 'snoozed', '--reason', 'Wait for review', '--until', '2099-01-01T00:00:00.000Z']);
  assert.equal(run(['state', '--project', project, '--database', database]).tasks.find(t => t.taskId === 'T-001').disposition.state, 'snoozed');
  const verified = run(['record', '--project', project, '--task', 'T-001', '--expected-hash', revision,
    '--outcome', 'verified-complete', '--reference', 'https://directory.example/receipt', '--summary', 'Fictional external receipt reviewed']);
  run(['disposition', '--project', project, '--task', 'T-001', '--expected-hash', revision,
    '--database', database, '--state', 'active']);
  const result = run(['complete', '--project', project, '--task', 'T-001', '--expected-hash', revision,
    '--database', database, '--evidence', verified.path, '--evidence-hash', verified.hash]);
  assert.equal(result.status, 'done');
  assert.match(readFileSync(file, 'utf8'), /- \[x\] T-001/);
});
test('native wrappers resolve the same canonical workflow without nested agent configuration', () => {
  const root = resolve('.');
  const skill = readFileSync('.agents/skills/promotion-agent/SKILL.md', 'utf8');
  const links = [...skill.matchAll(/\]\(([^)]+)\)/g)].map(m => resolve('.agents/skills/promotion-agent', m[1]));
  assert.ok(links.includes(join(root, 'templates/WORKFLOW.md')));
  for (const link of links) assert.ok(readFileSync(link).length > 0);
  for (const file of ['.claude/commands/promote.md', '.opencode/commands/promote.md']) {
    const content = readFileSync(file, 'utf8');
    assert.ok(content.includes('templates/WORKFLOW.md'));
    assert.doesNotMatch(content, /^model:|^agent:|^context:\s*fork|^subtask:|!`/m);
  }
});
