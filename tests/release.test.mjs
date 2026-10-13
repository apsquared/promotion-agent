import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { releaseSource, releaseSourcePath } from '../src/interactive/release-source.ts';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';
import { prepareTask, recordTaskEvidence } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';
import { promptCategory, needsBrowser } from '../src/core/task-prompt.ts';

function git(source, args) {
  return execFileSync('git', ['--no-optional-locks', '-C', source, ...args], { encoding: 'utf8', env: {
    ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
    GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
  } }).trim();
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source');
  const workspace = join(root, 'workspace');
  mkdirSync(source);
  mkdirSync(workspace);
  git(source, ['init', '--quiet']);
  writeFileSync(join(source, 'README.md'), '# Fictional Note Desk\nOrganize notes.\n');
  git(source, ['add', 'README.md']);
  git(source, ['commit', '--quiet', '-m', 'baseline']);
  const base = git(source, ['rev-parse', 'HEAD']);
  writeFileSync(join(source, 'README.md'), '# Fictional Note Desk\nPin a note from Notes to keep it above other notes.\nFounder-confirmed availability: all standard-plan workspaces, production, 2026-10-09.\n');
  writeFileSync(join(source, 'notes.ts'), 'export const orderNotes = notes => [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));\n');
  git(source, ['add', '.']);
  git(source, ['commit', '--quiet', '-m', 'available feature']);
  const available = git(source, ['rev-parse', 'HEAD']);
  writeFileSync(join(source, 'notes.ts'), 'const pinOrder = (a, b) => Number(b.pinned) - Number(a.pinned);\nexport const orderNotes = notes => [...notes].sort(pinOrder);\n');
  git(source, ['add', '.']);
  git(source, ['commit', '--quiet', '-m', 'internal refactor']);
  const internal = git(source, ['rev-parse', 'HEAD']);
  writeFileSync(join(source, 'sharing.ts'), 'export const sharingEnabled = false;\n');
  writeFileSync(join(source, 'CHANGELOG.md'), '# Unreleased\nShare links implemented; not deployed. No release date.\n');
  writeFileSync(join(source, '.env'), 'SENTINEL=never-read-or-return\n');
  mkdirSync(join(source, 'data'));
  writeFileSync(join(source, 'data/customers.json'), 'never-read-or-return\n');
  git(source, ['add', '.']);
  git(source, ['commit', '--quiet', '-m', 'never-print-this-private-message']);
  const head = git(source, ['rev-parse', 'HEAD']);
  const plan = previewInstall(workspace, 'Fictional Note Desk', source);
  applyInstall(workspace, plan, reviewHash(plan));
  return { root, source, workspace, base, available, internal, head };
}
function snapshot(dir) {
  return Object.fromEntries(readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? Object.entries(snapshot(join(dir, e.name))).map(([p, hash]) => [`${e.name}/${p}`, hash])
    : [[e.name, createHash('sha256').update(readFileSync(join(dir, e.name))).digest('hex')]]));
}
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(([, p]) => resolve(dirname(file), p));
}

test('release source freezes all IDs with bounded sanitized names and leaves source and Git bytes unchanged', t => {
  const f = fixture(t);
  writeFileSync(join(f.source, 'uncommitted.ts'), 'export const notShipped = true;\n');
  const before = snapshot(f.source);
  const result = releaseSource(f.workspace, f.base, 'HEAD');
  assert.equal(result.baseCommit, f.base);
  assert.equal(result.headCommit, f.head);
  assert.deepEqual(result.commits.map(c => c.commit), [f.available, f.internal, f.head]);
  assert.equal(result.projectId, JSON.parse(readFileSync(join(f.workspace, 'promotion-agent.json'))).id);
  assert.deepEqual(result.commits[2].files.sort(), ['CHANGELOG.md', 'sharing.ts']);
  assert.equal(result.commits[2].excludedFileCount, 2);
  assert.doesNotMatch(JSON.stringify(result), /SENTINEL|customers|\.env|never-print|uncommitted|fixture@example/);
  assert.deepEqual(snapshot(f.source), before);
  assert.throws(() => releaseSource(f.workspace, '--output=bad', 'HEAD'), /individual local refs/);
  assert.throws(() => releaseSource(f.workspace, 'HEAD..HEAD', 'HEAD'), /individual local refs/);
  assert.throws(() => releaseSource(f.workspace, '$(touch bad)', 'HEAD'), /individual local refs/);
  assert.throws(() => releaseSource(f.workspace, f.head, f.base), /Git read failed/);
  assert.throws(() => releaseSource(f.source, f.base, f.head), /registered promotion workspace/);
  assert.deepEqual(releaseSource(f.workspace, f.head, f.head).commits, []);
  assert.deepEqual(snapshot(f.source), before);
  const cli = JSON.parse(execFileSync(process.execPath, ['dist/scripts/promotion.mjs', 'release-source', '--project', f.workspace, '--base', f.base, '--head', f.head], { encoding: 'utf8' }));
  assert.deepEqual(cli, result);
  assert.deepEqual(snapshot(f.source), before);
});

test('release source filters known sensitive paths and reports truncation instead of silently dropping scope', t => {
  for (const p of ['.env.production', 'src/secrets.ts', 'docs/private-roadmap.md', 'data/events.json', 'fixtures/users.json', 'customers.csv', 'keys.pem', '.npmrc', 'src/customer.ts', 'package-lock.json', 'credentials/config.yml', '../README.md', 'src/bad\nname.ts'])
    assert.equal(releaseSourcePath(p), false, p);
  assert.equal(releaseSourcePath('src/notes.ts'), true);
  const f = fixture(t);
  for (let i = 0; i < 55; i++) writeFileSync(join(f.source, `change-${i}.md`), 'fictional\n');
  git(f.source, ['add', '.']);
  git(f.source, ['commit', '--quiet', '-m', 'large file list']);
  const result = releaseSource(f.workspace, f.head, 'HEAD');
  assert.equal(result.commits[0].files.length, 50);
  assert.equal(result.commits[0].omittedFileCount, 5);
  // A subsequent moving ref cannot change a saved comparison resolved by full IDs.
  assert.equal(releaseSource(f.workspace, f.base, f.head).headCommit, f.head);
  for (let i = 0; i < 100; i++) git(f.source, ['commit', '--quiet', '--allow-empty', '-m', 'bounded range']);
  assert.throws(() => releaseSource(f.workspace, f.base, 'HEAD'), /exceeds 100 commits/);
  writeFileSync(join(f.source, '.git/shallow'), `${f.base}\n`);
  assert.throws(() => releaseSource(f.workspace, f.base, f.head), /complete local history/);
});

test('release route, pack contract, fallback and installed resources share deployment and revision rules', t => {
  const workflow = readFileSync('templates/WORKFLOW.md', 'utf8');
  assert.match(workflow, /"Prepare a launch pack for what I shipped since last Friday".*activity `release`/);
  assert.match(workflow, /\| release \|.*coordinated pack/);
  assert.equal(promptCategory('release'), 'release');
  assert.equal(promptCategory('launch-pack'), 'release');
  assert.equal(promptCategory('launch'), 'directory'); // Existing submission meaning retained.
  assert.equal(needsBrowser({ category: 'release', actionUrl: '', materials: 'Review a local pack' }), false);
  const procedure = 'templates/activities/release/WORKFLOW.md';
  const text = readFileSync(procedure, 'utf8');
  for (const phrase of ['base excluded, head included', 'SHA-256', 'all** prior pack', 'cherry-picks', 'internal-only', 'undeployed', 'unknown', 'unresolved fact', 'confirmed', 'environment', 'audience', 'v002.md', 'invalidates its approval', 'at most three', 'category `video`'])
    assert.ok(text.includes(phrase), phrase);
  for (const link of links(procedure)) assert.ok(existsSync(link), link);
  const f = fixture(t);
  const moved = join(f.root, 'moved');
  renameSync(f.workspace, moved);
  for (const name of ['WORKFLOW.md', 'PACK.md']) {
    const installed = join(moved, '.promotion-agent/templates/activities/release', name);
    assert.equal(readFileSync(installed, 'utf8'), readFileSync(`templates/activities/release/${name}`, 'utf8'));
    for (const link of links(installed)) assert.ok(existsSync(link), link);
  }
  const runtime = join(moved, '.promotion-agent/scripts/promotion.mjs');
  const result = JSON.parse(execFileSync(process.execPath, [runtime, 'release-source', '--project', moved, '--base', f.base, '--head', f.head], { encoding: 'utf8' }));
  assert.equal(result.headCommit, f.head);
  assert.match(readFileSync(join(moved, '.promotion-agent/docs/INSTALLED.md'), 'utf8'), /release-source/);
});

test('release versions and source snapshot remain task-linked drafts in the review desk, with video handoff', t => {
  const f = fixture(t);
  const sourceBefore = snapshot(f.source);
  const releaseId = 'd46dbdeb-513a-4dc7-b0fc-1711f586afec';
  const dir = `marketing/releases/${releaseId}`;
  mkdirSync(join(f.workspace, dir, 'versions'), { recursive: true });
  const source = releaseSource(f.workspace, f.base, f.head);
  writeFileSync(join(f.workspace, dir, 'sources.json'), JSON.stringify(source, null, 2));
  writeFileSync(join(f.workspace, dir, 'PACK.md'), `# Synthetic pack\nProject ID: ${source.projectId}\nRelease ID: ${releaseId}\nStatus: draft\nDeployment unknowns require review.\n`);
  // Synthetic copy tests storage/handoff only; agent-authored acceptance is recorded separately.
  const version = `${dir}/versions/v001.md`;
  const copy = '# X announcement\nPin your notes.\n\n# Short release notes\nPinned notes.\n\n# Customer-facing explanation\nUse Notes.\n\n# Demo storyboard\nCapture pending.\n';
  writeFileSync(join(f.workspace, version), copy);
  const taskPath = join(f.workspace, 'marketing/TASKS.md');
  const tasks = `# Marketing tasks\n\n## Open\n\n- [ ] T-801 | 2026-10-13 | P1 | release | Review the launch pack\n      Materials: Release ${releaseId}; version ${version}; source ${dir}/sources.json. Review availability evidence and exact copy.\n\n- [ ] T-802 | 2026-10-13 | P2 | video | Render the approved release storyboard\n      Materials: Follow-up to T-801. After storyboard approval; ${version}; C-001 only.\n\n## Done\n`;
  writeFileSync(taskPath, tasks);
  const prepared = prepareTask(f.workspace, 'T-801');
  for (const phrase of ['exact base/head', 'merged commit alone', 'source table', 'previous release packs', 'marketing/releases/', 'existing video activity', 'publishing workflow']) assert.ok(prepared.prompt.includes(phrase), phrase);
  recordTaskEvidence(f.workspace, 'T-801', prepared.revision, 'draft', version, 'Coordinated pack awaiting review; no public action.');
  recordTaskEvidence(f.workspace, 'T-801', prepared.revision, 'draft', `${dir}/sources.json`, 'Frozen source comparison; no deployment proof.');
  const revision = `${dir}/versions/v002.md`;
  writeFileSync(join(f.workspace, revision), `${copy}\nRevised draft; approval pending.\n`);
  recordTaskEvidence(f.workspace, 'T-801', prepared.revision, 'draft', revision, 'Revised draft; prior approval invalidated.');
  const data = reviewData(f.workspace);
  const task = data.tasks.find(t => t.taskId === 'T-801');
  assert.equal(task.status, 'open');
  assert.equal(task.completion, null);
  assert.equal(task.drafts.length, 3);
  const handoff = reviewPrompt(data, task);
  assert.equal(handoff.target, 'promotion');
  assert.ok(handoff.text.includes(version));
  assert.ok(handoff.text.includes(revision));
  assert.ok(prepareTask(f.workspace, 'T-802').prompt.includes('product video activity'));
  assert.equal(readFileSync(join(f.workspace, version), 'utf8'), copy);
  assert.equal(readFileSync(taskPath, 'utf8'), tasks);
  assert.deepEqual(snapshot(f.source), sourceBefore);
});

test('agent-authored three-change acceptance pack keeps availability scope consistent across outputs', () => {
  const dir = 'examples/release-pack';
  const source = JSON.parse(readFileSync(join(dir, 'sources.json')));
  const pack = readFileSync(join(dir, 'PACK.md'), 'utf8');
  assert.equal(source.commits.length, 3);
  for (const id of [source.projectId, source.baseCommit, source.headCommit, ...source.commits.map(c => c.commit)]) assert.ok(pack.includes(id), id);
  assert.match(pack, /C-001.*confirmed by.*founder statement/);
  assert.match(pack, /C-002.*internal-only.*omitted from all public drafts/);
  assert.match(pack, /C-003.*undeployed.*omitted from all public drafts and demo/);
  for (const name of ['v001.md', 'v002.md']) {
    const text = readFileSync(join(dir, 'versions', name), 'utf8');
    for (const heading of ['X announcement', 'Short release notes', 'Customer-facing explanation']) {
      const copy = text.split(`## ${heading}\n\n`)[1].split('\n\nPrivate claim mapping:')[0];
      assert.match(copy, /standard-plan/);
      assert.doesNotMatch(copy, /shar(?:e|ing)|refactor|faster|speed|reliability/i);
      if (heading === 'X announcement') assert.ok(copy.length <= 280);
    }
    const scenes = text.split('\n').filter(line => /^\| \d/.test(line));
    assert.equal(scenes.length, 4);
    for (const scene of scenes) {
      assert.match(scene, /Standard-plan workspaces/);
      assert.match(scene, /C-001 \| pending/);
      assert.doesNotMatch(scene, /shar(?:e|ing)/i);
    }
  }
  const tasks = readFileSync(join(dir, 'TASKS.md'), 'utf8');
  assert.equal([...tasks.matchAll(/^- \[ \] T-/gm)].length, 3);
  assert.doesNotMatch(tasks, /^- \[x\]/m);
  for (const link of links(join(dir, 'README.md'))) assert.ok(existsSync(link), link);
});
