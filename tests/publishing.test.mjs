import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createProject, loadProjectConfig, postScheduler, serializeProjectConfig } from '../src/core/contracts.ts';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { completeSelectedTask, prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { parseScheduledPost, projectLocalTime } from '../src/publishing/scheduled-post.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';

// Fictional configuration only. No test here runs Post Bridge, its CLI or any network call.
const example = JSON.parse(readFileSync('examples/example-desk/promotion-agent.json', 'utf8'));
const change = (fn) => { const copy = structuredClone(example); fn(copy); return copy; };
const procedureDir = 'templates/publishing';
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .filter(([, href]) => !/^https?:/.test(href)).map(([, href]) => resolve(dirname(file), href));
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-publishing-'));
  const project = join(root, 'product');
  cpSync('examples/example-desk', project, { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return { root, project };
}

test('a project without a scheduler resolves to the manual adapter and stays byte-compatible', () => {
  assert.equal(Object.hasOwn(example, 'scheduler'), false);
  assert.deepEqual(postScheduler(loadProjectConfig(example)), { adapter: 'manual', accounts: {} });
  assert.equal(Object.hasOwn(JSON.parse(serializeProjectConfig(example)), 'scheduler'), false);
  assert.equal(Object.hasOwn(createProject(example.id, 'New'), 'scheduler'), false);
  const bridged = change(p => { p.policy.publish = 'exact-content-review'; p.scheduler = { adapter: 'post-bridge', accounts: { x: '12345', linkedin: '67890' } }; });
  assert.deepEqual(loadProjectConfig(JSON.parse(serializeProjectConfig(bridged))), bridged);
  assert.deepEqual(postScheduler(loadProjectConfig(bridged)), { adapter: 'post-bridge', accounts: { x: '12345', linkedin: '67890' } });
  assert.deepEqual(postScheduler(loadProjectConfig(change(p => p.scheduler = { adapter: 'manual', accounts: { x: '@exampledesk' } }))).accounts, { x: '@exampledesk' });
});

test('scheduler configuration rejects unknown adapters, credential fields and unapproved publishing', () => {
  const publishing = p => p.policy.publish = 'exact-content-review';
  const invalid = [
    p => { publishing(p); p.scheduler = { adapter: 'buffer' }; },
    p => { publishing(p); p.scheduler = {}; },
    p => { publishing(p); p.scheduler = 'post-bridge'; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', apiKey: 'fixture-secret' }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', token: 'fixture-secret' }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', accounts: { apiKey: 'fixture-secret' } }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', accounts: { x: 'pb_live_fixturesecret' } }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', accounts: { x: 'Bearer fixture' } }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', accounts: { x: '' } }; },
    p => { publishing(p); p.scheduler = { adapter: 'post-bridge', accounts: ['12345'] }; },
    // Post Bridge is an external action; a project denying publication keeps manual handoffs.
    p => p.scheduler = { adapter: 'post-bridge' },
  ];
  for (const edit of invalid) assert.throws(() => loadProjectConfig(change(edit)));
});

test('shared workflow routes posting to the one publishing procedure and its adapter references', () => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  assert.match(workflow, /^# Marketing workflow contract — version 0\.18$/m);
  const route = workflow.split('\n').find(line => line.startsWith('- **"Post this"'));
  assert.ok(route, 'Publishing request route missing');
  assert.match(route, /Schedule it for Tuesday 9am/);
  assert.match(route, /\(publishing\/WORKFLOW\.md\)/);
  for (const section of ['## Review and action', '## Tasks and evidence']) {
    const body = workflow.split(section)[1].split('\n## ')[0];
    assert.match(body, /publishing\/WORKFLOW\.md/, `${section} does not route through the publishing procedure`);
  }
  const procedure = resolve(procedureDir, 'WORKFLOW.md');
  const referenced = links(procedure);
  assert.ok(referenced.includes(resolve('templates/WORKFLOW.md')));
  for (const link of referenced) assert.ok(existsSync(link), `Missing linked resource: ${link}`);
  for (const name of readdirSync(procedureDir).filter(n => n !== 'WORKFLOW.md'))
    assert.ok(referenced.includes(resolve(procedureDir, name)), `${name} is not linked from the publishing procedure`);
  const text = readFileSync(procedure, 'utf8');
  for (const boundary of ['exact content, account and time', 'Absent means `manual`', 'never runs a timer, daemon, cron or queue',
    'never print a key', 'Scheduled post: post-bridge', '13:00 UTC', 'A scheduled record cannot complete a task', 'Refuse to schedule a duplicate'])
    assert.ok(text.includes(boundary), `Procedure lacks boundary: ${boundary}`);
  const bridge = readFileSync(resolve(procedureDir, 'post-bridge.md'), 'utf8');
  for (const rule of ['npx postbridge-cli', 'POST_BRIDGE_API_KEY', 'needs_reconnect', 'publishes immediately', 'No X threads', 'stripped', 'has_x_premium', '2026-10-12'])
    assert.ok(bridge.includes(rule), `Post Bridge reference lacks: ${rule}`);
  assert.match(readFileSync('templates/SETUP.md', 'utf8'), /Leave `scheduler` out/);
});

test('publishing procedure resolves in installed workspaces after relocation and follows ownership', t => {
  const { root, project } = fixture(t);
  const plan = previewInstall(project, 'Ignored existing name');
  assert.ok(plan.entries.some(e => e.path === '.promotion-agent/templates/publishing/post-bridge.md' && e.action === 'create'));
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated');
  renameSync(project, moved);
  const installedWorkflow = join(moved, '.promotion-agent/templates/WORKFLOW.md');
  assert.ok(links(installedWorkflow).includes(join(moved, '.promotion-agent', procedureDir, 'WORKFLOW.md')));
  for (const name of readdirSync(procedureDir)) {
    const installed = join(moved, '.promotion-agent', procedureDir, name);
    assert.equal(readFileSync(installed, 'utf8'), readFileSync(join(procedureDir, name), 'utf8'));
    for (const link of links(installed)) assert.ok(existsSync(link), `Missing installed resource: ${link}`);
  }
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /templates\/publishing\/WORKFLOW\.md/);
  // A customized procedure survives upgrade and removal; unchanged ones are removed with the runtime.
  const customized = join(moved, '.promotion-agent', procedureDir, 'manual.md');
  writeFileSync(customized, 'User-customized manual adapter\n');
  const upgraded = previewInstall(moved, 'Ignored');
  assert.equal(upgraded.entries.find(e => e.path === `.promotion-agent/${procedureDir}/manual.md`).action, 'preserve');
  applyInstall(moved, upgraded, reviewHash(upgraded));
  const removal = previewRemoval(moved);
  applyRemoval(moved, removal, removalHash(removal));
  assert.equal(readFileSync(customized, 'utf8'), 'User-customized manual adapter\n');
  assert.equal(existsSync(join(moved, '.promotion-agent', procedureDir, 'post-bridge.md')), false);
});

test('scheduled-post summaries parse strictly and convert to the project timezone', () => {
  const summary = 'Scheduled post: post-bridge\nChannel: x\nAccount: 12345\nScheduled for: 2026-10-13T13:00:00Z\nProvider reference: 98765\nStatus: scheduled, unverified';
  assert.deepEqual(parseScheduledPost(summary), {
    adapter: 'post-bridge', channel: 'x', account: '12345', scheduledFor: '2026-10-13T13:00:00.000Z', reference: '98765', status: 'scheduled',
  });
  assert.equal(parseScheduledPost('Scheduled post: manual\nScheduled for: 2026-10-14T09:30Z\nStatus: cancelled').status, 'cancelled');
  assert.equal(parseScheduledPost('Scheduled post: manual\nScheduled for: 2026-10-14T09:30Z\nStatus: maybe').status, 'uncertain');
  for (const bad of ['Draft prepared for review', 'Scheduled post: buffer\nScheduled for: 2026-10-13T13:00:00Z',
    'Scheduled post: manual\nScheduled for: Tuesday 9am', 'Scheduled post: manual\nScheduled for: 2026-10-13T09:00:00-04:00'])
    assert.equal(parseScheduledPost(bad), null);
  assert.equal(projectLocalTime('2026-10-13T13:00:00.000Z', 'America/New_York'), 'Tue 2026-10-13 09:00 America/New_York');
  assert.equal(projectLocalTime('2026-10-13T13:00:00.000Z', 'UTC'), 'Tue 2026-10-13 13:00 UTC');
});

test('a scheduled social task stays open on the review desk until verified-complete evidence closes it', t => {
  const { root, project } = fixture(t);
  const database = join(root, 'state.sqlite');
  const taskFile = join(project, 'marketing/TASKS.md');
  writeFileSync(taskFile, '# Marketing tasks\n\n## Open\n\n- [ ] T-701 | 2026-10-12 | P1 | social | Schedule the approved X post\n      URL: https://x.com/exampledesk\n      Materials: Approved post in marketing/drafts/2026-10-13-x.txt.\n\n## Done\n');
  const prepared = prepareTask(project, 'T-701');
  mkdirSync(join(project, 'marketing/drafts'), { recursive: true });
  const approved = 'marketing/drafts/2026-10-13-x.txt';
  writeFileSync(join(project, approved), 'A shared checklist keeps repeated questions in one place.\n');
  const scheduled = recordTaskEvidence(project, 'T-701', prepared.revision, 'draft', approved,
    'Scheduled post: post-bridge\nChannel: x\nAccount: 12345\nScheduled for: 2026-10-13T13:00:00Z\nProvider reference: 98765\nStatus: scheduled, unverified');

  let data = reviewData(project);
  let task = data.tasks.find(item => item.taskId === 'T-701');
  assert.equal(task.status, 'open');
  assert.equal(task.completion, null);
  assert.equal(task.scheduled.adapter, 'post-bridge');
  assert.equal(task.scheduled.status, 'scheduled');
  assert.equal(task.scheduled.reference, '98765');
  assert.equal(task.scheduled.localTime, 'Tue 2026-10-13 09:00 America/New_York');
  assert.equal(data.project.scheduler, 'manual');
  assert.equal(data.tasks.find(item => item.taskId !== 'T-701')?.scheduled ?? null, null);
  const handoff = reviewPrompt(data, task);
  assert.match(handoff.text, /Recorded as scheduled through the post-bridge adapter for Tue 2026-10-13 09:00 America\/New_York \(13:00 UTC\), reference 98765/);
  assert.match(handoff.text, /Scheduled is not published/);

  // A scheduled (draft) record can never complete the task.
  assert.throws(() => completeSelectedTask(project, 'T-701', prepared.revision, database, scheduled.path, scheduled.hash), /does not match/);
  assert.match(readFileSync(taskFile, 'utf8'), /- \[ \] T-701/);

  const live = 'https://x.com/exampledesk/status/1234567890';
  const verified = recordTaskEvidence(project, 'T-701', prepared.revision, 'verified-complete', live,
    `Outputs: Published ${live}, text matches the approved draft.\nImpact: Expected: one more weekly post on X.\nNext steps: none needed.`);
  completeSelectedTask(project, 'T-701', prepared.revision, database, verified.path, verified.hash);
  data = reviewData(project);
  task = data.tasks.find(item => item.taskId === 'T-701');
  assert.equal(task.status, 'done');
  assert.equal(task.scheduled, null);
  assert.equal(task.completion.reference, live);
});

test('promotion-agent code makes no provider calls; Post Bridge is reached only by the agent in its session', () => {
  const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
  for (const file of [...files('src'), ...files('schemas'), ...files('scripts'), ...files('app')])
    assert.doesNotMatch(readFileSync(file, 'utf8'), /postbridge-cli|post-bridge\.com|POST_BRIDGE_API_KEY/, `${file} references the provider`);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['next', 'react', 'react-dom']);
});
