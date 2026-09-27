import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as schema from '../schemas/contracts.ts';
import { bindProject, createProject, defaultPolicy, loadProjectConfig, reviewMatches, serializeProjectConfig, taskIdentity, verifiedProductFacts } from '../src/core/contracts.ts';
import { parseTaskSnapshot } from '../src/core/legacy-tasks.mjs';
const example = JSON.parse(readFileSync(new URL('../examples/example-desk/promotion-agent.json', import.meta.url)));
const projectId = example.id;
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = '2026-09-26T12:00:00.000Z';
const local = { schemaVersion: 1, projectId, checkoutPath: '/fictional/example-desk', preferredAgent: null, credentialReferences: [] };
const change = (fn) => { const copy = structuredClone(example); fn(copy); return copy; };

test('portable fixture round trips and new projects default to manual draft/review with no actions authorized', () => {
  assert.deepEqual(loadProjectConfig(JSON.parse(serializeProjectConfig(example))), example);
  assert.deepEqual(createProject(projectId, 'New').policy, defaultPolicy());
  assert.equal(createProject(projectId, 'New').cadence.kind, 'manual');
  assert.deepEqual(verifiedProductFacts(example), []);
});

test('strict config rejects unknown versions, malformed fields, credentials, and local configuration', () => {
  const invalid = [
    p => p.schemaVersion = 0, p => p.schemaVersion = 2, p => p.id = 'example-desk',
    p => p.displayName = '', p => p.policy.spending = 'allow', p => p.policy.commit = true,
    p => p.policy.validationCommands = ['npm test'], p => p.policy.validationCommands = [{ argv: [], cwd: null, timeoutSeconds: 10 }],
    p => p.policy.validationCommands = [{ argv: ['npm', 'test'], cwd: null, timeoutSeconds: 0 }],
    p => p.checkoutPath = '/fictional', p => p.apiKey = 'fixture-secret', p => p.policy.token = 'fixture-secret',
    p => p.credentialReferences = [], p => p.timezone = 'Mars/Base', p => p.timezone = '+05:00',
    p => p.cadence = { kind: 'weekly', localTime: '24:00', weekdays: [1] },
    p => p.cadence = { kind: 'weekly', localTime: '12:00', weekdays: [1, 1] },
    p => p.cadence = { kind: 'manual', localTime: '12:00', weekdays: [] },
  ];
  for (const edit of invalid) assert.throws(() => loadProjectConfig(change(edit)));
  assert.throws(() => schema.localProjectSchema.parse({ ...local, credentialReferences: [{ connector: 'example', environmentVariable: 'EXAMPLE_KEY', value: 'secret' }] }));
});

test('portable paths reject traversal, absolute paths, and ambiguous globs; commands use argument arrays', () => {
  for (const path of ['../outside', '/tmp/outside', 'C:\\outside', 'a/../b', 'a//b', './a', 'a\\b', 'a/*', 'a/\0b']) {
    assert.throws(() => loadProjectConfig(change(p => p.policy.allowedWritePaths = [path])));
  }
  const valid = change(p => p.policy.validationCommands = [{ argv: ['npm', 'test', '--', 'literal argument'], cwd: null, timeoutSeconds: 60 }]);
  assert.deepEqual(loadProjectConfig(valid).policy.validationCommands[0].argv, ['npm', 'test', '--', 'literal argument']);
});

test('local registry mapping and legacy task identity survive rename/relocation without changing import diagnostics', () => {
  const doc = readFileSync(new URL('../examples/example-desk/marketing/TASKS.md', import.meta.url), 'utf8');
  const snapshot = parseTaskSnapshot(doc);
  const before = snapshot.tasks.map(t => taskIdentity(bindProject(example, local).project.id, t.taskId));
  const moved = bindProject({ ...example, displayName: 'Renamed' }, { ...local, checkoutPath: 'D:\\fictional\\moved' });
  assert.deepEqual(snapshot.tasks.map(t => taskIdentity(moved.project.id, t.taskId)), before);
  assert.notEqual(taskIdentity(id, 'T-001'), before[0]);
  assert.equal(snapshot.canReconcile, true);
  assert.throws(() => bindProject(example, { ...local, projectId: id }));
  assert.throws(() => schema.localProjectSchema.parse({ ...local, checkoutPath: 'relative/path' }));
  assert.throws(() => taskIdentity(projectId, 'T-001:other'));
});

test('unknown and unverified facts cannot become verified claims without evidence', () => {
  const verified = { key: 'name', status: 'verified', value: 'Example Desk', sources: [{ path: 'marketing/AGENT.md', reference: 'Product name' }], verifiedAt: now };
  const project = { ...example, facts: [...example.facts, { ...verified, status: 'unverified', verifiedAt: null }, verified] };
  assert.deepEqual(verifiedProductFacts(project), [verified]);
  for (const fact of [{ ...verified, sources: [] }, { ...verified, verifiedAt: null }, { ...verified, status: 'unknown' }]) {
    assert.throws(() => loadProjectConfig({ ...example, facts: [fact] }));
  }
  assert.throws(() => schema.timestamp.parse('2026-02-30T12:00:00.000Z'));
});

const input = { schemaVersion: 1, id, projectId, agent: 'codex', activity: 'directory-kit', context: [], policy: defaultPolicy(), budget: { maxSeconds: 60, maxCostUsd: null }, outputDirectory: 'marketing/drafts/run' };
const output = { summary: 'Prepared draft', artifacts: [], taskProposals: [], changedFiles: [], evidence: [{ description: 'Read draft', reference: 'marketing/drafts/run', observedAt: now }], errors: [], sessionReference: null, usage: { inputTokens: null, outputTokens: null, costUsd: null } };
test('canonical runs retain unknown usage and reject unsupported success, failure, and cross-project outputs', () => {
  const run = { input, status: 'succeeded', startedAt: now, endedAt: now, output };
  assert.equal(schema.runSchema.parse(run).output.usage.costUsd, null);
  for (const bad of [{ ...run, output: null }, { ...run, status: 'failed' }, { ...run, output: { ...output, evidence: [] } }, { ...run, endedAt: null }, { ...run, status: 'queued' }]) assert.throws(() => schema.runSchema.parse(bad));
  const artifact = { schemaVersion: 1, id, revision: id, projectId, runId: id, path: 'marketing/drafts/kit.md', mediaType: 'text/markdown', sha256: 'a'.repeat(64) };
  schema.runSchema.parse({ ...run, output: { ...output, artifacts: [artifact] } });
  assert.throws(() => schema.runSchema.parse({ ...run, output: { ...output, artifacts: [{ ...artifact, projectId: id }] } }));
  schema.runSchema.parse({ ...run, status: 'failed', startedAt: null, output: { ...output, errors: [{ code: 'missing-agent', message: 'Install CLI' }] } });
  schema.runSchema.parse({ ...run, status: 'cancelled' });
});

test('reviews bind exact artifact revision, destination, account, action and time', () => {
  const binding = { projectId, artifactId: id, artifactRevision: id, action: 'schedule', destination: 'fictional-channel', accountReference: 'fictional-account', scheduledFor: now };
  const review = { schemaVersion: 1, id, binding, decision: 'approved', decidedAt: now };
  assert.equal(reviewMatches(review, binding), true);
  for (const field of ['projectId', 'artifactId', 'artifactRevision', 'destination', 'accountReference', 'scheduledFor', 'action']) {
    const value = field.endsWith('Id') || field === 'artifactRevision' ? (binding[field] === projectId ? id : projectId) : field === 'scheduledFor' ? '2026-09-27T12:00:00.000Z' : field === 'action' ? 'publish' : 'different';
    assert.equal(reviewMatches(review, { ...binding, [field]: value }), false);
  }
  assert.equal(reviewMatches({ ...review, decision: 'pending', decidedAt: null }, binding), false);
});

test('dispositions keep skipped separate from file completion; draft schedules validate cadence', () => {
  const disposition = { schemaVersion: 1, task: { projectId, taskId: 'T-001' }, state: 'skipped', reason: 'Not relevant', until: null };
  schema.taskDispositionSchema.parse(disposition);
  assert.throws(() => schema.taskDispositionSchema.parse({ ...disposition, state: 'done' }));
  assert.throws(() => schema.taskDispositionSchema.parse({ ...disposition, state: 'snoozed' }));
  const schedule = { schemaVersion: 1, id, projectId, enabled: false, kind: 'draft-run', timezone: 'America/New_York', cadence: { kind: 'weekly', localTime: '09:30', weekdays: [1, 5] }, budget: input.budget, missedRunPolicy: 'skip', nextRunAt: null };
  schema.scheduleSchema.parse(schedule);
  for (const bad of [{ ...schedule, kind: 'publish' }, { ...schedule, missedRunPolicy: 'replay-all' }, { ...schedule, cadence: example.cadence }]) assert.throws(() => schema.scheduleSchema.parse(bad));
});

test('all adapters share one capabilities contract and allow honest unknown authentication', () => {
  for (const agent of ['codex', 'claude-code', 'opencode']) {
    const capabilities = { schemaVersion: 1, agent, installedVersion: null, available: false, authentication: 'unknown', enforcedModes: [], supportsCancel: false, supportsResume: false, supportsStructuredOutput: false, supportsUsage: false, diagnostic: 'Not detected', verifiedAt: null, evidenceReference: null };
    schema.adapterCapabilitiesSchema.parse(capabilities);
    assert.throws(() => schema.adapterCapabilitiesSchema.parse({ ...capabilities, enforcedModes: ['draft'] }));
    schema.adapterCapabilitiesSchema.parse({ ...capabilities, available: true, installedVersion: 'fixture-version', enforcedModes: ['draft'], verifiedAt: now, evidenceReference: 'fictional smoke-test record' });
  }
});
