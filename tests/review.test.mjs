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
import { completionReport, reviewPrompt } from '../src/review/prompts.js';
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
  assert.equal(result.registry.status, 'registered');
  assert.equal(result.tasks[0].disposition.state, 'skipped');
  assert.deepEqual(readFileSync(f.database), beforeDB);
  assert.deepEqual(readFileSync(f.file), original);
  writeFileSync(
    f.file,
    original.toString().replace('Prepare Example Directory listing', 'Changed task title'),
  );
  result = reviewData(f.project, f.database);
  assert.equal(result.tasks[0].title, 'Changed task title');
  assert.deepEqual(readFileSync(f.database), beforeDB);
  writeFileSync(f.file, '# Invalid tasks');
  result = reviewData(f.project, f.database);
  assert.equal(result.classification, 'invalid');
  assert.deepEqual(readFileSync(f.database), beforeDB);
});
test('saved records are linked to their task without reading referenced files', (t) => {
  const f = fixture(t);
  const revision = inspectProject(f.project).snapshot.hash;
  mkdirSync(join(f.project, 'marketing/drafts'), { recursive: true });
  writeFileSync(join(f.project, 'marketing/drafts/post.md'), 'Private draft body');
  recordTaskEvidence(
    f.project,
    'T-001',
    revision,
    'draft',
    'marketing/drafts/post.md',
    'Prepared draft',
  );
  const data = reviewData(f.project);
  assert.equal(data.tasks[0].drafts[0].reference, 'marketing/drafts/post.md');
  assert.equal(data.tasks[1].drafts.length, 0);
  assert.doesNotMatch(JSON.stringify(data), /Private draft body/);
  writeFileSync(join(f.project, 'marketing/logs/promotion-agent/invalid.json'), '{}');
  assert.match(reviewData(f.project).warnings.join(' '), /Cannot read saved record/);
});
test('dispositions are selected by stable project ID', (t) => {
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
  store.close();
  setSelectedTaskDisposition(f.project, 'T-002', first.snapshot.hash, f.database, 'skipped', 'Later', null);
  rmSync(otherRoot, { recursive: true });
  const data = reviewData(f.project, f.database);
  assert.equal(data.tasks.find((task) => task.taskId === 'T-002').disposition.state, 'skipped');
  assert.equal(data.tasks.find((task) => task.taskId === 'T-001').disposition, null);
});
test('missing, incompatible and corrupt registries remain readable as file-only views', (t) => {
  const f = fixture(t);
  writeFileSync(f.database, 'not sqlite');
  const data = reviewData(f.project, f.database);
  assert.equal(data.registry.status, 'unavailable');
  assert.equal(data.tasks.length, 4);
  assert.ok(data.warnings.length);
});
test('one prompt per task, labeled for the promotion agent or the product repo', (t) => {
  const f = fixture(t);
  const revision = inspectProject(f.project).snapshot.hash;
  recordTaskEvidence(f.project, 'T-001', revision, 'draft', 'marketing/AGENT.md', 'Prepared');
  let data = reviewData(f.project);
  const promotion = reviewPrompt(data, data.tasks[0]);
  assert.equal(promotion.target, 'promotion');
  assert.match(promotion.text, /^Continue Example Desk promotion task T-001/);
  assert.ok(promotion.text.includes(data.tasks[0].agentPrompt));
  assert.ok(promotion.text.includes(data.project.root));
  assert.match(promotion.text, /- marketing\/AGENT\.md/);
  assert.match(promotion.text, /ask before publishing/);
  assert.match(promotion.text, /add follow-up tasks to .*without asking/);
  assert.match(promotion.text, /Follow-up to T-001\./);
  assert.match(promotion.text, /record `verified-complete` evidence/);
  assert.match(promotion.text, /^Outputs: .*\nImpact: .*\nNext steps: /m);
  const original = readFileSync(f.file, 'utf8');
  writeFileSync(
    f.file,
    original.replace('| P2 | engagement | Review a relevant discussion', '| P2 | product | Fix the pricing copy'),
  );
  data = reviewData(f.project);
  const product = reviewPrompt(data, data.tasks[1]);
  assert.equal(product.target, 'product');
  assert.match(product.text, /^Implement this change in the Example Desk product repository/);
  assert.ok(product.text.includes(data.tasks[1].materials));
  assert.ok(product.text.includes(`promotion workspace at ${data.project.root}`));
  assert.match(product.text, /Don't commit, push or deploy until I approve/);
  assert.match(product.text, /promotion agent can queue it as tasks/);
  assert.match(product.text, /^Outputs: .*\nImpact: .*\nNext steps: /m);
});
test('done tasks carry the newest verified-complete summary as outputs, impact and next steps', (t) => {
  const f = fixture(t);
  const revision = inspectProject(f.project).snapshot.hash;
  recordTaskEvidence(f.project, 'T-001', revision, 'draft', 'marketing/AGENT.md', 'Prepared');
  recordTaskEvidence(
    f.project,
    'T-001',
    revision,
    'verified-complete',
    'https://directory.example/listing',
    'Outputs: Listing live at https://directory.example/listing\nwith the approved logo.\nImpact: expected: a steady trickle of referral visits.\nNext steps: queued T-004 to check referrals on 2026-10-17.',
  );
  writeFileSync(f.file, readFileSync(f.file, 'utf8').replace('- [ ] T-001', '- [x] T-001'));
  const data = reviewData(f.project);
  const done = data.tasks.find((task) => task.taskId === 'T-001');
  assert.equal(done.status, 'done');
  assert.equal(done.completion.outcome, 'verified-complete');
  assert.equal(done.completion.reference, 'https://directory.example/listing');
  assert.deepEqual(completionReport(done.completion.summary), {
    text: '',
    sections: [
      { label: 'Outputs', text: 'Listing live at https://directory.example/listing\nwith the approved logo.' },
      { label: 'Impact', text: 'expected: a steady trickle of referral visits.' },
      { label: 'Next steps', text: 'queued T-004 to check referrals on 2026-10-17.' },
    ],
  });
  assert.equal(data.tasks.find((task) => task.taskId === 'T-003').completion, null);
  assert.deepEqual(completionReport('Fictional receipt reviewed'), {
    text: 'Fictional receipt reviewed',
    sections: [],
  });
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
