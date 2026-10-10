import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, symlinkSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { previewInstall, applyInstall, reviewHash } from '../src/onboarding/install.ts';
import { observerSource, requireWorkspace } from '../src/onboarding/workspace.ts';
import { inspectProject, prepareTask, recordTaskEvidence, completeSelectedTask, setSelectedTaskDisposition } from '../src/interactive/tasks.ts';
import { reviewData } from '../src/review/data.ts';
import { reviewPrompt } from '../src/review/prompts.js';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'promotion-observer-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source'); mkdirSync(source);
  const workspace = join(root, 'workspace'); mkdirSync(workspace);
  writeFileSync(join(source, 'README.md'), 'A fictional product.');
  writeFileSync(join(source, 'AGENTS.md'), 'Existing product instructions.');
  mkdirSync(join(source, 'marketing'));
  writeFileSync(join(source, 'marketing/TASKS.md'), 'Existing product task bytes stay untouched.');
  return { root, source, workspace };
}
function snapshot(root) {
  return readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => [entry.name, entry.isDirectory() ? snapshot(join(root, entry.name)) : readFileSync(join(root, entry.name)).toString('base64')]);
}
function cli(...args) {
  return spawnSync(process.execPath, ['dist/scripts/promotion.mjs', ...args], { encoding: 'utf8' });
}
function install(workspace, source) {
  const plan = previewInstall(workspace, 'Fictional Product', source);
  applyInstall(workspace, plan, reviewHash(plan));
}
const task = `# Tasks\n\n## Open\n\n- [ ] T-001 | 2026-10-09 | P1 | competitor | Prepare report\n      URL: https://example.com\n      Materials: Reviewable report\n\n## Done\n`;

test('observer CLI lifecycle keeps source byte-identical and reviews workspace evidence', t => {
  const { root, source, workspace } = fixture(t);
  const before = snapshot(source);
  const planPath = join(root, 'plan.json');
  const preview = cli('onboard', '--project', source, '--workspace', workspace, '--name', 'Fictional Product', '--plan', planPath);
  assert.equal(preview.status, 0, preview.stderr);
  assert.deepEqual(readdirSync(workspace), []);
  const applied = cli('install', '--project', workspace, '--plan', planPath, '--review-hash', JSON.parse(preview.stdout).reviewHash);
  assert.equal(applied.status, 0, applied.stderr);
  const sourceRoot = requireWorkspace(workspace).sourcePath;
  assert.equal(sourceRoot, observerSource(workspace, source).sourcePath);
  writeFileSync(join(workspace, 'marketing/TASKS.md'), task);
  const prepared = prepareTask(workspace, 'T-001');
  assert.equal(prepared.sourceRoot, sourceRoot);
  assert.match(prepared.prompt, /repository is read only/);
  mkdirSync(join(workspace, 'marketing/drafts'));
  writeFileSync(join(workspace, 'marketing/drafts/report.md'), 'Fictional report prepared and checked.');
  const draft = recordTaskEvidence(workspace, 'T-001', prepared.revision, 'draft', 'marketing/drafts/report.md', 'Prepared report');
  const data = reviewData(workspace);
  assert.equal(data.project.sourceRoot, sourceRoot);
  assert.equal(data.tasks[0].evidence[0].preview.text, 'Fictional report prepared and checked.');
  const prompt = reviewPrompt(data, data.tasks[0], 'prepare');
  assert.match(prompt, /observed repository read only/);
  assert.match(prompt, /observedRepository/);
  assert.throws(() => completeSelectedTask(workspace, 'T-001', prepared.revision, join(root, 'state.sqlite'), draft.path, draft.hash), /completion evidence/);
  const evidence = recordTaskEvidence(workspace, 'T-001', prepared.revision, 'verified-complete', 'marketing/drafts/report.md', 'Validated local report');
  completeSelectedTask(workspace, 'T-001', prepared.revision, join(root, 'state.sqlite'), evidence.path, evidence.hash);
  assert.equal(inspectProject(workspace).snapshot.tasks[0].status, 'done');
  const second = previewInstall(workspace, 'Ignored name', source);
  applyInstall(workspace, second, reviewHash(second));
  assert.equal(inspectProject(workspace).project.id, prepared.projectId);
  assert.deepEqual(snapshot(source), before);
});

test('overlap, source outputs and symlink aliases are rejected before writes', t => {
  const { root, source, workspace } = fixture(t);
  const before = snapshot(source);
  assert.throws(() => observerSource(source, source), /non-overlapping/);
  const child = join(source, 'child'); mkdirSync(child);
  assert.throws(() => observerSource(child, source), /non-overlapping/);
  assert.throws(() => observerSource(root, source), /non-overlapping/);
  const alias = join(root, 'alias'); symlinkSync(source, alias);
  assert.throws(() => observerSource(alias, source), /non-overlapping/);
  const rejected = cli('onboard', '--project', source, '--workspace', workspace, '--name', 'Test', '--plan', join(alias, 'plan.json'));
  assert.equal(rejected.status, 1);
  install(workspace, source);
  writeFileSync(join(workspace, 'marketing/TASKS.md'), task);
  const prepared = prepareTask(workspace, 'T-001');
  assert.throws(() => setSelectedTaskDisposition(workspace, 'T-001', prepared.revision, join(alias, 'state.sqlite'), 'skipped', 'Test', null), /bookkeeping outputs/);
  symlinkSync(join(source, 'README.md'), join(workspace, 'source-reference.md'));
  assert.throws(() => recordTaskEvidence(workspace, 'T-001', prepared.revision, 'draft', 'source-reference.md', 'Test'), /Symlink/);
  const sourceInspect = cli('inspect', '--project', source);
  assert.equal(sourceInspect.status, 1);
  assert.match(sourceInspect.stderr, /registered promotion workspace/);
  // Remove only our deliberately created overlap fixture before comparing.
  rmSync(child, { recursive: true });
  assert.deepEqual(snapshot(source), before);
});

test('multiple workspaces isolate identity and relocation retains the stable ID', t => {
  const { root, source, workspace } = fixture(t);
  install(workspace, source);
  const otherSource = join(root, 'other-source'); mkdirSync(otherSource);
  const otherWorkspace = join(root, 'other-workspace'); mkdirSync(otherWorkspace);
  install(otherWorkspace, otherSource);
  const id = inspectProject(workspace).project.id;
  assert.notEqual(inspectProject(otherWorkspace).project.id, id);
  assert.throws(() => previewInstall(workspace, 'Wrong source', otherSource), /another repository/);
  const moved = join(root, 'moved-workspace'); renameSync(workspace, moved);
  assert.equal(inspectProject(moved).project.id, id);
  assert.equal(requireWorkspace(moved).sourcePath, observerSource(moved, source).sourcePath);
});

test('legacy product-local plans and changed canonical source mappings fail closed', t => {
  const { root, source, workspace } = fixture(t);
  const before = snapshot(source);
  const legacyPlan = previewInstall(source, 'Legacy fixture only');
  const planPath = join(root, 'legacy-plan.json');
  writeFileSync(planPath, JSON.stringify(legacyPlan));
  const applied = cli('install', '--project', source, '--plan', planPath, '--review-hash', reviewHash(legacyPlan));
  assert.equal(applied.status, 1);
  assert.match(applied.stderr, /observer workspace plan/);
  assert.deepEqual(snapshot(source), before);
  const alias = join(root, 'source-alias'); symlinkSync(source, alias);
  install(workspace, alias);
  const config = JSON.parse(readFileSync(join(workspace, 'promotion-source.json'), 'utf8'));
  // A manual mapping redirected through an alias is rejected, even if currently resolvable.
  writeFileSync(join(workspace, 'promotion-source.json'), JSON.stringify({ ...config, sourcePath: alias }));
  assert.throws(() => inspectProject(workspace), /mapping changed/);
  const denied = cli('remove-preview', '--project', workspace, '--plan', join(root, 'remove.json'));
  assert.equal(denied.status, 1);
  assert.deepEqual(snapshot(source), before);
});


test('a product display name differs from source folder and package name across registration and upgrade', t => {
  const { root, source, workspace } = fixture(t);
  const checkout = join(root, 'legacy-console');
  renameSync(source, checkout);
  writeFileSync(join(checkout, 'README.md'), '# Beacon Desk\n\nBeacon Desk is a fictional support product.');
  writeFileSync(join(checkout, 'package.json'), JSON.stringify({ name: 'legacy-console', private: true }));
  const before = snapshot(checkout);
  const planPath = join(root, 'brand-plan.json');
  const preview = cli('onboard', '--project', checkout, '--workspace', workspace, '--name', 'Beacon Desk', '--plan', planPath);
  assert.equal(preview.status, 0, preview.stderr);
  const applied = cli('install', '--project', workspace, '--plan', planPath, '--review-hash', JSON.parse(preview.stdout).reviewHash);
  assert.equal(applied.status, 0, applied.stderr);
  const inspected = inspectProject(workspace);
  assert.equal(inspected.project.displayName, 'Beacon Desk');
  assert.equal(requireWorkspace(workspace).sourcePath, observerSource(workspace, checkout).sourcePath);
  assert.equal(reviewData(workspace).project.displayName, 'Beacon Desk');
  const upgrade = previewInstall(workspace, 'legacy-console', checkout);
  applyInstall(workspace, upgrade, reviewHash(upgrade));
  assert.equal(inspectProject(workspace).project.displayName, 'Beacon Desk');
  assert.equal(inspectProject(workspace).project.id, inspected.project.id);
  assert.deepEqual(snapshot(checkout), before);
});
