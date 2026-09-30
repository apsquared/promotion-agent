import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  symlinkSync,
  realpathSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';
import {
  recordTaskEvidence,
  inspectProject,
  setSelectedTaskDisposition,
} from '../src/interactive/tasks.ts';
import { Store } from '../src/storage/store.ts';
import { GET } from '../app/api/review/route.ts';
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-review-'));
  const project = join(dir, 'fictional');
  cpSync(new URL('../examples/example-desk/', import.meta.url), project, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return {
    dir,
    project,
    database: join(dir, 'state.sqlite'),
    file: join(project, 'marketing/TASKS.md'),
  };
}
test('review reads current files and optional database without creating or reconciling data', (t) => {
  const f = fixture(t);
  const initial = reviewData(f.project, f.database);
  assert.equal(initial.registry.status, 'absent');
  assert.equal(existsSync(f.database), false);
  const original = readFileSync(f.file);
  setSelectedTaskDisposition(
    f.project,
    'T-001',
    initial.revision,
    f.database,
    'skipped',
    'Already listed',
    null,
  );
  const beforeDB = readFileSync(f.database);
  let result = reviewData(f.project, f.database);
  assert.equal(result.tasks[0].disposition.state, 'skipped');
  assert.equal(result.registry.tasks.length, 4);
  assert.deepEqual(readFileSync(f.database), beforeDB);
  assert.deepEqual(readFileSync(f.file), original);
  writeFileSync(
    f.file,
    original.toString().replace('Prepare Example Directory listing', 'Changed task title'),
  );
  result = reviewData(f.project, f.database);
  assert.equal(result.tasks[0].title, 'Changed task title');
  assert.match(result.warnings.join(' '), /out of date/);
  assert.deepEqual(readFileSync(f.database), beforeDB);
  writeFileSync(f.file, '# Invalid tasks');
  result = reviewData(f.project, f.database);
  assert.equal(result.classification, 'invalid');
  assert.equal(result.registry.tasks.length, 4);
  assert.deepEqual(readFileSync(f.database), beforeDB);
});
test('review includes task evidence and safe text previews, marks changed files, rejects symlinks', (t) => {
  const f = fixture(t);
  const revision = inspectProject(f.project).snapshot.hash;
  mkdirSync(join(f.project, 'marketing/drafts'), { recursive: true });
  const draft = join(f.project, 'marketing/drafts/post.md');
  writeFileSync(draft, '<script>alert("untrusted")</script>\nDraft copy');
  recordTaskEvidence(
    f.project,
    'T-001',
    revision,
    'draft',
    'marketing/drafts/post.md',
    'Prepared draft',
  );
  let data = reviewData(f.project);
  assert.equal(data.tasks[0].evidence[0].preview.text, readFileSync(draft, 'utf8'));
  assert.equal(data.tasks[0].evidence[0].preview.status, 'Matches recorded hash');
  writeFileSync(draft, 'New revision');
  data = reviewData(f.project);
  assert.match(data.tasks[0].evidence[0].preview.status, /Changed/);
  rmSync(draft);
  writeFileSync(join(f.dir, 'private.md'), 'outside private data');
  symlinkSync(join(f.dir, 'private.md'), draft);
  data = reviewData(f.project);
  assert.equal(data.tasks[0].evidence[0].preview.text, null);
  assert.doesNotMatch(JSON.stringify(data), /outside private data/);
  writeFileSync(join(f.project, 'marketing/logs/promotion-agent/invalid.json'), '{}');
  assert.match(reviewData(f.project).warnings.join(' '), /Cannot review evidence/);
});
test('registry records are selected by stable project ID without reading other checkouts', (t) => {
  const f = fixture(t);
  const first = inspectProject(f.project);
  const store = new Store(f.database);
  const local = {
    schemaVersion: 1,
    projectId: first.project.id,
    checkoutPath: f.project,
    preferredAgent: null,
    credentialReferences: [],
  };
  store.registerProject(first.project, local);
  const otherId = randomUUID();
  const otherRoot = join(f.dir, 'other');
  mkdirSync(otherRoot);
  store.registerProject(
    { ...first.project, id: otherId, displayName: 'Other' },
    { ...local, projectId: otherId, checkoutPath: otherRoot },
  );
  const runId = randomUUID();
  const run = (id) => ({
    input: {
      schemaVersion: 1,
      id: randomUUID(),
      projectId: id,
      agent: 'codex',
      activity: 'social',
      context: [],
      policy: first.project.policy,
      budget: { maxSeconds: 60, maxCostUsd: null },
      outputDirectory: 'marketing/drafts',
    },
    status: 'queued',
    startedAt: null,
    endedAt: null,
    output: null,
  });
  store.saveRecord('run', run(first.project.id));
  store.saveRecord('run', run(otherId));
  store.saveRecord('artifact', {
    schemaVersion: 1,
    id: randomUUID(),
    revision: randomUUID(),
    projectId: first.project.id,
    runId,
    path: 'marketing/AGENT.md',
    mediaType: 'text/markdown',
    sha256: '0'.repeat(64),
  });
  store.close();
  rmSync(otherRoot, { recursive: true });
  const data = reviewData(f.project, f.database);
  assert.equal(data.registry.records.length, 2);
  assert.equal(
    data.registry.records.find((r) => r.kind === 'run').value.input.projectId,
    first.project.id,
  );
  assert.match(data.registry.records.find((r) => r.kind === 'artifact').preview.status, /Changed/);
});
test('missing, incompatible and corrupt registries remain readable as file-only views', (t) => {
  const f = fixture(t);
  writeFileSync(f.database, 'not sqlite');
  const data = reviewData(f.project, f.database);
  assert.equal(data.registry.status, 'unavailable');
  assert.equal(data.tasks.length, 4);
  assert.ok(data.warnings.length);
});
test('all handoff intents include exact task, evidence, hashes and notes without claiming approval', (t) => {
  const f = fixture(t);
  const data = reviewData(f.project);
  for (const intent of ['prepare', 'revise', 'action', 'verify']) {
    const prompt = reviewPrompt(data, data.tasks[0], intent, 'Make it shorter.');
    assert.ok(prompt.includes(data.revision));
    assert.ok(prompt.includes(data.tasks[0].materials.replaceAll('\n', '\\n')));
    assert.match(prompt, /Make it shorter/);
    assert.match(prompt, /Never mark a task complete solely/);
    assert.match(prompt, /Re-read the task/);
  }
  assert.match(reviewPrompt(data, data.tasks[0], 'action'), /does not itself approve publishing/);
  assert.match(reviewPrompt(data, data.tasks[0], 'prepare'), /Do not publish or schedule/);
  assert.throws(() => reviewPrompt(data, data.tasks[0], 'unknown'), /Unknown/);
});
test('Next route requires a session token, rejects cross-origin requests, and accepts no path parameters', async (t) => {
  const f = fixture(t);
  const keys = [
    'PROMOTION_REVIEW_PROJECT',
    'PROMOTION_REVIEW_DATABASE',
    'PROMOTION_REVIEW_TOKEN',
    'PROMOTION_REVIEW_ORIGIN',
  ];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys)
      saved[key] === undefined ? delete process.env[key] : (process.env[key] = saved[key]);
  });
  Object.assign(process.env, {
    PROMOTION_REVIEW_PROJECT: f.project,
    PROMOTION_REVIEW_DATABASE: '',
    PROMOTION_REVIEW_TOKEN: 'test-session-token',
    PROMOTION_REVIEW_ORIGIN: 'http://127.0.0.1:4317',
  });
  const request = (headers = {}, path = '') =>
    new Request(`http://127.0.0.1:4317/api/review${path}`, {
      headers: { host: '127.0.0.1:4317', ...headers },
    });
  assert.equal(GET(request()).status, 401);
  assert.equal(GET(request({ authorization: 'Bearer wrong' })).status, 401);
  assert.equal(
    GET(request({ authorization: 'Bearer test-session-token', origin: 'https://outside.example' }))
      .status,
    403,
  );
  const response = GET(
    request({ authorization: 'Bearer test-session-token' }, '?project=/unselected'),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).project.root, realpathSync(f.project));
  delete process.env.PROMOTION_REVIEW_TOKEN;
  assert.equal(GET(request({ authorization: 'Bearer test-session-token' })).status, 401);
});
