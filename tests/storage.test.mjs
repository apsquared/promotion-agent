import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, symlinkSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../src/storage/store.ts';
import { LegacyProjectImporter } from '../src/storage/legacy-project-import.ts';
import { ConflictError, ProjectLockedError, withProjectLock } from '../src/storage/files.ts';
import { completeTaskText, strictTaskSnapshot } from '../src/core/task-snapshot.ts';
import { createProject, defaultPolicy } from '../src/core/contracts.ts';
const fixture = readFileSync(new URL('../examples/example-desk/marketing/TASKS.md', import.meta.url), 'utf8');
const empty = readFileSync(new URL('../templates/marketing/TASKS.md', import.meta.url), 'utf8');
const projectId = '12345678-1234-4123-8123-123456789abc';
const otherId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = '2026-09-26T12:00:00.000Z';
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-agent-test-'));
  const repo = join(dir, 'fictional-project');
  mkdirSync(join(repo, 'marketing'), { recursive: true });
  const file = join(repo, 'marketing', 'TASKS.md');
  writeFileSync(file, fixture);
  const dbfile = join(dir, 'state.sqlite');
  const store = new Store(dbfile);
  const project = createProject(projectId, 'Fictional Project');
  const local = { schemaVersion: 1, projectId, checkoutPath: repo, preferredAgent: null, credentialReferences: [] };
  store.registerProject(project, local);
  t.after(() => { try { store.close(); } catch {} rmSync(dir, { recursive: true, force: true }); });
  return { dir, repo, file, dbfile, store, project, local };
}

test('strict snapshots preserve legacy fixtures but reject ambiguous/partial task structures', () => {
  assert.equal(strictTaskSnapshot(fixture).canReconcile, true);
  assert.deepEqual(strictTaskSnapshot(empty).tasks, []);
  const invalid = [
    fixture.replace('## Done', '## Finished'), fixture.replace('## Done', '## Open'),
    fixture.replace('2026-09-26', '2026-02-30'), fixture.replace('T-002', 'T-001'),
    fixture.replace('Materials: Name:', 'Unknown: Name:'), fixture.replace('- [ ] T-002', ' - [ ] T-002'),
    fixture.replace('      Prompt:', '      Materials:'), fixture.replace('## Open', '## Open-ish'),
    fixture.replace('## Open', '## Open\n```'), fixture + '\n## Archive\n- [ ] T-999 | 2026-09-26 | P1 | other | Hidden',
    '## Open\n- [ ] T-001 | 2026-09-26 | P1 | other | Cut off',
  ];
  for (const doc of invalid) assert.equal(strictTaskSnapshot(doc).canReconcile, false, doc);
});

test('completion preserves every byte except checkbox across LF/CRLF, BOM, multiline prompt and old tasks', () => {
  for (const doc of [fixture, fixture.replaceAll('\n', '\r\n'), '\ufeff' + fixture, fixture.trimEnd()]) {
    for (const task of ['T-001', 'T-002', 'T-004']) {
      const result = completeTaskText(doc, task);
      assert.equal(result, doc.replace(`- [ ] ${task}`, `- [x] ${task}`));
      const before = strictTaskSnapshot(doc).tasks.find(t => t.taskId === task);
      const after = strictTaskSnapshot(result).tasks.find(t => t.taskId === task);
      assert.equal(after.materials, before.materials);
      assert.equal(after.agentPrompt, before.agentPrompt);
      assert.equal(after.status, 'done');
      assert.equal(completeTaskText(result, task), result);
    }
  }
});

test('SQLite initial migration is persistent and restart/re-import are idempotent', t => {
  const { store, dbfile } = setup(t);
  store.scanProject(projectId);
  const first = store.listTasks(projectId);
  store.scanProject(projectId);
  assert.deepEqual(store.listTasks(projectId), first);
  store.close();
  const reopened = new Store(dbfile);
  t.after(() => reopened.close());
  assert.deepEqual(reopened.listTasks(projectId), first);
  assert.equal(reopened.exportData().tables.migration_history.length, 1);
});

test('future database versions are rejected without changing the version', t => {
  const { store, dbfile } = setup(t);
  store.close();
  const db = new DatabaseSync(dbfile);
  db.exec('PRAGMA user_version = 99'); db.close();
  assert.throws(() => new Store(dbfile), /newer than supported/);
  const check = new DatabaseSync(dbfile);
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 99); check.close();
});

test('malformed, missing, non-file and invalid UTF-8 scans never archive imported tasks', t => {
  const { store, file } = setup(t);
  store.scanProject(projectId);
  const before = store.listTasks(projectId);
  for (const data of [fixture.replace('## Done', '## Broken'), '', Buffer.from([0xff, 0xfe])]) {
    writeFileSync(file, data);
    assert.equal(store.scanProject(projectId).reconciled, false);
    assert.deepEqual(store.listTasks(projectId), before);
  }
  rmSync(file);
  assert.equal(store.scanProject(projectId).classification, 'missing');
  assert.deepEqual(store.listTasks(projectId), before);
  mkdirSync(file);
  assert.equal(store.scanProject(projectId).classification, 'unreadable');
  assert.deepEqual(store.listTasks(projectId), before);
});

test('only valid complete snapshots archive removed tasks; a valid reappearance restores them', t => {
  const { store, file } = setup(t);
  store.scanProject(projectId);
  writeFileSync(file, empty);
  assert.equal(store.scanProject(projectId).reconciled, true);
  assert.ok(store.listTasks(projectId).every(t => t.archived));
  writeFileSync(file, fixture);
  store.scanProject(projectId);
  assert.ok(store.listTasks(projectId).every(t => !t.archived));
});

test('skip, snooze and assignment persist independently of repo status through rescan and archival', t => {
  const { store, file } = setup(t);
  store.scanProject(projectId);
  const disposition = { schemaVersion: 1, task: { projectId, taskId: 'T-001' }, state: 'skipped', reason: 'Not relevant', until: null };
  store.setDisposition(disposition); store.setAssignee(projectId, 'T-001', 'fictional-reviewer');
  assert.equal(readFileSync(file, 'utf8'), fixture);
  assert.equal(store.listTasks(projectId)[0].status, 'open');
  writeFileSync(file, empty); store.scanProject(projectId);
  writeFileSync(file, fixture); store.scanProject(projectId);
  assert.deepEqual(store.listTasks(projectId)[0].disposition, disposition);
  assert.equal(store.listTasks(projectId)[0].assignee, 'fictional-reviewer');
  const scan = store.scanProject(projectId);
  store.completeTask(projectId, 'T-001', scan.hash);
  assert.equal(store.listTasks(projectId)[0].status, 'done');
  assert.equal(store.listTasks(projectId)[0].disposition.state, 'skipped');
});

test('write-back rejects stale hashes and conflicts between independent Store connections', t => {
  const { store, dbfile, file, repo } = setup(t);
  const second = new Store(dbfile); t.after(() => second.close());
  const scan = store.scanProject(projectId);
  const result = second.completeTask(projectId, 'T-001', scan.hash);
  assert.equal(result.classification, 'valid');
  assert.throws(() => store.completeTask(projectId, 'T-002', scan.hash), ConflictError);
  const completed = readFileSync(file, 'utf8');
  assert.equal(completed, fixture.replace('- [ ] T-001', '- [x] T-001'));
  writeFileSync(file, completed + '\n');
  assert.throws(() => store.completeTask(projectId, 'T-002', result.hash), ConflictError);
  assert.deepEqual(readdirSync(join(repo, 'marketing')), ['TASKS.md']);
});

test('per-project locks exclude another process and release after failure', t => {
  const { store } = setup(t);
  const moduleUrl = new URL('../src/storage/files.ts', import.meta.url).href;
  withProjectLock(store.lockRoot, projectId, () => {
    assert.throws(() => store.scanProject(projectId), ProjectLockedError);
    const script = `import { withProjectLock, ProjectLockedError } from ${JSON.stringify(moduleUrl)};
      try { withProjectLock(process.argv[1], process.argv[2], () => {}); process.exit(2); }
      catch(e) { process.exit(e instanceof ProjectLockedError ? 0 : 3); }`;
    const child = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script, store.lockRoot, projectId], { encoding: 'utf8' });
    assert.equal(child.status, 0, child.stderr);
  });
  assert.throws(() => withProjectLock(store.lockRoot, projectId, () => { throw new Error('fixture failure'); }), /fixture failure/);
  assert.equal(store.scanProject(projectId).classification, 'valid');
});

test('symlink file and directory escapes fail closed and never modify the target', t => {
  const { store, file, repo, dir } = setup(t);
  const snapshot = store.scanProject(projectId);
  const outside = join(dir, 'outside.md'); writeFileSync(outside, fixture);
  rmSync(file); symlinkSync(outside, file);
  assert.equal(store.scanProject(projectId).classification, 'unreadable');
  assert.throws(() => store.completeTask(projectId, 'T-001', snapshot.hash), /Cannot edit/);
  assert.equal(readFileSync(outside, 'utf8'), fixture);
  rmSync(join(repo, 'marketing'), { recursive: true });
  const external = join(dir, 'external'); mkdirSync(external); writeFileSync(join(external, 'TASKS.md'), fixture);
  symlinkSync(external, join(repo, 'marketing'), 'dir');
  assert.equal(store.scanProject(projectId).classification, 'unreadable');
  assert.equal(store.listTasks(projectId).length, 4);
});

test('rename and explicit relocation preserve task identities; duplicate checkout registration fails', t => {
  const { store, project, local, repo, dir } = setup(t);
  store.scanProject(projectId);
  const before = store.listTasks(projectId);
  store.registerProject({ ...project, displayName: 'New name' }, local);
  assert.deepEqual(store.listTasks(projectId), before);
  assert.throws(() => store.registerProject(createProject(otherId, 'Duplicate'), { ...local, projectId: otherId }), /UNIQUE/);
  const moved = join(dir, 'moved'); renameSync(repo, moved);
  assert.throws(() => store.registerProject(project, { ...local, checkoutPath: moved }), /relocation/);
  store.registerProject(project, { ...local, checkoutPath: moved }, { allowRelocation: true });
  assert.equal(store.scanProject(projectId).classification, 'valid');
  assert.deepEqual(store.listTasks(projectId), before);
});

function records() {
  const run = { input: { schemaVersion: 1, id: otherId, projectId, agent: 'codex', activity: 'draft', context: [], policy: defaultPolicy(), budget: { maxSeconds: 60, maxCostUsd: null }, outputDirectory: 'marketing/drafts' }, status: 'queued', startedAt: null, endedAt: null, output: null };
  const artifact = { schemaVersion: 1, id: otherId, revision: otherId, projectId, runId: otherId, path: 'marketing/drafts/test.md', mediaType: 'text/markdown', sha256: 'a'.repeat(64) };
  const review = { schemaVersion: 1, id: otherId, binding: { projectId, artifactId: otherId, artifactRevision: otherId, action: 'apply', destination: 'marketing/drafts/test.md', accountReference: null, scheduledFor: null }, decision: 'pending', decidedAt: null };
  const schedule = { schemaVersion: 1, id: otherId, projectId, enabled: false, kind: 'draft-run', timezone: 'UTC', cadence: { kind: 'daily', localTime: '09:00', weekdays: [] }, budget: run.input.budget, missedRunPolicy: 'skip', nextRunAt: null };
  return { run, artifact, review, schedule };
}

test('backup restoration and local export include operational state, assignments and dispositions', t => {
  const { store, dir, file } = setup(t);
  store.scanProject(projectId);
  store.setDisposition({ schemaVersion: 1, task: { projectId, taskId: 'T-001' }, state: 'snoozed', reason: null, until: now });
  store.setAssignee(projectId, 'T-001', 'fixture-reviewer');
  for (const [kind, value] of Object.entries(records())) store.saveRecord(kind, value);
  writeFileSync(file, empty); store.scanProject(projectId);
  assert.equal(store.listRecords(projectId).length, 4);
  const backup = join(dir, 'backup.sqlite'); store.backupTo(backup);
  const restored = new Store(backup); t.after(() => restored.close());
  assert.deepEqual(restored.exportData(), store.exportData());
  assert.throws(() => store.backupTo(backup), /EEXIST/);
  const exported = join(dir, 'export.json'); store.exportTo(exported);
  assert.deepEqual(JSON.parse(readFileSync(exported, 'utf8')), JSON.parse(JSON.stringify(store.exportData())));
  assert.throws(() => store.exportTo(exported), /EEXIST/);
  if (process.platform !== 'win32') assert.equal(statSync(exported).mode & 0o777, 0o600);
});

test('record ownership and immutable artifact revisions reject collisions', t => {
  const { store, dir } = setup(t);
  const { artifact, run } = records();
  store.saveRecord('artifact', artifact);
  assert.throws(() => store.saveRecord('artifact', { ...artifact, sha256: 'b'.repeat(64) }), /immutable/);
  store.saveRecord('run', run);
  const another = join(dir, 'another'); mkdirSync(another);
  store.registerProject(createProject(otherId, 'Another'), { schemaVersion: 1, projectId: otherId, checkoutPath: another, preferredAgent: null, credentialReferences: [] });
  assert.throws(() => store.saveRecord('run', { ...run, input: { ...run.input, projectId: otherId } }), /another project/);
});

test('removing a project only deletes its local state, never source files', t => {
  const { store, file } = setup(t);
  store.scanProject(projectId); store.saveRecord('run', records().run);
  store.removeProject(projectId);
  assert.equal(readFileSync(file, 'utf8'), fixture);
  assert.deepEqual(store.listProjects(), []);
  for (const table of ['tasks', 'task_state', 'imports', 'records']) assert.deepEqual(store.exportData().tables[table], []);
});

function importTable(dir) {
  for (const name of ['alpha', 'beta']) mkdirSync(join(dir, name));
  const file = join(dir, 'selected-projects.md');
  writeFileSync(file, '# Fictional portfolio\n\n| Project | Source Dir | Website |\n| --- | --- | --- |\n| Alpha | `alpha` | https://alpha.example |\n| Beta | `beta` | https://beta.example |\n');
  return file;
}

test('legacy import preview makes no writes and only selected rows register; re-import is idempotent', t => {
  const { store, dir } = setup(t);
  const source = importTable(dir);
  const importer = new LegacyProjectImporter(store);
  const preview = importer.preview(source);
  assert.deepEqual(preview.diagnostics, []);
  assert.equal(store.listProjects().length, 1);
  importer.apply(preview.token, [preview.rows[0].line]);
  assert.equal(store.listProjects().length, 2);
  const id = preview.rows[0].projectId;
  assert.equal(store.getProject(id).project.policy.mode, 'draft');
  const second = importer.preview(source);
  assert.equal(second.rows[0].projectId, id);
  importer.apply(second.token, [second.rows[0].line]);
  assert.equal(store.listProjects().length, 2);
  assert.throws(() => importer.apply(preview.token, [preview.rows[0].line]), /consumed/);
});

test('changed, missing, malformed and partially invalid project imports leave all prior state intact', t => {
  const { store, dir, file } = setup(t);
  store.scanProject(projectId);
  const before = store.exportData();
  const importer = new LegacyProjectImporter(store);
  const source = importTable(dir);
  let preview = importer.preview(source);
  writeFileSync(source, readFileSync(source, 'utf8') + '\n');
  assert.throws(() => importer.apply(preview.token, [preview.rows[0].line]), /changed/);
  writeFileSync(source, '| Project | Source Dir |\n| --- | --- |\n| Existing | fictional-project |\n| Missing | missing |\n');
  preview = importer.preview(source);
  assert.ok(preview.diagnostics.length);
  assert.throws(() => importer.apply(preview.token, [preview.rows[0].line]), /Invalid/);
  writeFileSync(source, 'not a table');
  preview = importer.preview(source);
  assert.throws(() => importer.apply(preview.token, [1]), /Invalid/);
  rmSync(source);
  assert.throws(() => importer.preview(source), /ENOENT/);
  assert.deepEqual(store.exportData(), before);
  assert.equal(readFileSync(file, 'utf8'), fixture);
});

test('selected import transaction rolls back if a mapping becomes conflicting after preview', t => {
  const { store, dir } = setup(t);
  const importer = new LegacyProjectImporter(store);
  const source = importTable(dir);
  const preview = importer.preview(source);
  store.registerProject(createProject(otherId, 'Concurrent beta'), { schemaVersion: 1, projectId: otherId, checkoutPath: join(dir, 'beta'), preferredAgent: null, credentialReferences: [] });
  assert.throws(() => importer.apply(preview.token, preview.rows.map(r => r.line)), /mapping changed/);
  assert.equal(store.listProjects().length, 2);
  assert.ok(!store.listProjects().some(m => m.project.id === preview.rows[0].projectId));
});


test('an external edit during staging conflicts and removes the temporary file', t => {
  const { store, file, repo } = setup(t);
  const scan = store.scanProject(projectId);
  const original = fs.fsyncSync;
  const injected = fixture + '\n';
  const mock = t.mock.method(fs, 'fsyncSync', fd => { original(fd); writeFileSync(file, injected); });
  syncBuiltinESMExports();
  try { assert.throws(() => store.completeTask(projectId, 'T-001', scan.hash), ConflictError); }
  finally { mock.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(readFileSync(file, 'utf8'), injected);
  assert.deepEqual(readdirSync(join(repo, 'marketing')), ['TASKS.md']);
  assert.equal(store.listTasks(projectId)[0].status, 'open');
});

test('a failed atomic rename leaves original bytes and projection unchanged', t => {
  const { store, file, repo } = setup(t);
  const scan = store.scanProject(projectId);
  const mock = t.mock.method(fs, 'renameSync', () => { throw new Error('Simulated rename failure'); });
  syncBuiltinESMExports();
  try { assert.throws(() => store.completeTask(projectId, 'T-001', scan.hash), /rename failure/); }
  finally { mock.mock.restore(); syncBuiltinESMExports(); }
  assert.equal(readFileSync(file, 'utf8'), fixture);
  assert.deepEqual(readdirSync(join(repo, 'marketing')), ['TASKS.md']);
  assert.equal(store.listTasks(projectId)[0].status, 'open');
});

test('failed reconciliation rolls back archival and import metadata together', t => {
  const { store, dbfile, file } = setup(t);
  store.scanProject(projectId);
  const before = store.exportData();
  const db = new DatabaseSync(dbfile);
  db.exec("CREATE TRIGGER fail_task_insert BEFORE INSERT ON tasks BEGIN SELECT RAISE(ABORT, 'simulated insert failure'); END");
  writeFileSync(file, fixture.replace('Prepare Example Directory listing', 'Changed title'));
  assert.throws(() => store.scanProject(projectId), /simulated insert failure/);
  assert.deepEqual(store.exportData(), before);
  db.exec('DROP TRIGGER fail_task_insert'); db.close();
});

test('failed initial migration rolls back all DDL and version changes', t => {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-agent-migration-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const filename = join(dir, 'state.sqlite');
  const db = new DatabaseSync(filename);
  db.exec('CREATE TABLE tasks (existing TEXT)'); db.close();
  assert.throws(() => new Store(filename), /already exists/);
  const check = new DatabaseSync(filename);
  assert.equal(check.prepare('PRAGMA user_version').get().user_version, 0);
  assert.deepEqual(check.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name), ['tasks']);
  check.close();
});
