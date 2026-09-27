import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, cpSync, renameSync, symlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';
import { inspectProject } from '../src/interactive/tasks.ts';
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'promotion-onboard-'));
  const project = join(dir, 'fictional product'); mkdirSync(project);
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, project };
}
function install(project) {
  const plan = previewInstall(project, 'Fictional Product');
  applyInstall(project, plan, reviewHash(plan)); return plan;
}

test('preview writes nothing; applying a reviewed plan installs standalone defaults and keeps instructions', t => {
  const { project, dir } = setup(t);
  writeFileSync(join(project, 'AGENTS.md'), 'Existing instructions');
  writeFileSync(join(project, 'CLAUDE.md'), 'Existing Claude instructions');
  const plan = previewInstall(project, 'Fictional Product');
  assert.deepEqual(readdirSync(project).sort(), ['AGENTS.md', 'CLAUDE.md']);
  assert.throws(() => applyInstall(project, plan, 'a'.repeat(64)), /Review hash/);
  const installed = applyInstall(project, plan, reviewHash(plan));
  assert.ok(installed.changed.includes('promotion-agent.json'));
  assert.equal(readFileSync(join(project, 'AGENTS.md'), 'utf8'), 'Existing instructions');
  assert.equal(readFileSync(join(project, 'CLAUDE.md'), 'utf8'), 'Existing Claude instructions');
  const state = inspectProject(project);
  assert.equal(state.project.displayName, 'Fictional Product');
  assert.equal(state.project.policy.mode, 'draft');
  assert.deepEqual(state.snapshot.tasks, []);
  const owned = readFileSync(join(project, '.promotion-agent/manifest.json'), 'utf8');
  assert.ok(!owned.includes(dir));
  const skill = readFileSync(join(project, '.agents/skills/promotion-agent/SKILL.md'), 'utf8');
  for (const match of skill.matchAll(/\]\(([^)]+)\)/g)) assert.ok(existsSync(resolve(project, '.agents/skills/promotion-agent', match[1])));
});

test('existing project facts, task queue, logs and native commands are never overwritten or adopted', t => {
  const { project } = setup(t);
  cpSync(new URL('../examples/example-desk/', import.meta.url), project, { recursive: true });
  mkdirSync(join(project, '.claude/commands'), { recursive: true });
  writeFileSync(join(project, '.claude/commands/promote.md'), 'Custom command');
  const config = readFileSync(join(project, 'promotion-agent.json'), 'utf8');
  const tasks = readFileSync(join(project, 'marketing/TASKS.md'), 'utf8');
  const plan = install(project);
  assert.equal(readFileSync(join(project, 'promotion-agent.json'), 'utf8'), config);
  assert.equal(readFileSync(join(project, 'marketing/TASKS.md'), 'utf8'), tasks);
  assert.equal(readFileSync(join(project, '.claude/commands/promote.md'), 'utf8'), 'Custom command');
  assert.equal(plan.entries.find(e => e.path === '.claude/commands/promote.md').action, 'preserve');
  const owned = JSON.parse(readFileSync(join(project, '.promotion-agent/manifest.json'), 'utf8'));
  assert.equal(owned.files['.claude/commands/promote.md'], undefined);
});

test('unchanged installs are idempotent; edited workflow/configuration remain customized on upgrade', t => {
  const { project } = setup(t); install(project);
  const second = previewInstall(project, 'Different ignored name');
  assert.ok(second.entries.every(e => e.action === 'preserve'));
  const workflow = join(project, '.promotion-agent/templates/WORKFLOW.md');
  writeFileSync(workflow, 'Custom workflow');
  const configPath = join(project, 'promotion-agent.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8')); config.displayName = 'Renamed product';
  writeFileSync(configPath, JSON.stringify(config));
  const upgraded = previewInstall(project, 'Ignored name');
  assert.equal(upgraded.entries.find(e => e.path === '.promotion-agent/templates/WORKFLOW.md').reason, 'Existing or locally customized file');
  applyInstall(project, upgraded, reviewHash(upgraded));
  assert.equal(readFileSync(workflow, 'utf8'), 'Custom workflow');
  assert.equal(inspectProject(project).project.id, config.id);
  assert.equal(inspectProject(project).project.displayName, 'Renamed product');
});

test('a newer bundle updates only unmodified managed files after review', t => {
  const { project, dir } = setup(t); install(project);
  const source = join(dir, 'new-bundle'); cpSync('dist', source, { recursive: true });
  writeFileSync(join(source, 'templates/WORKFLOW.md'), 'New bundled workflow\n');
  const script = join(source, 'scripts/promotion.mjs');
  const planFile = join(dir, 'upgrade.json');
  const preview = spawnSync(process.execPath, [script, 'onboard', '--project', project, '--name', 'Ignored', '--plan', planFile], { encoding: 'utf8' });
  assert.equal(preview.status, 0, preview.stderr);
  const plan = JSON.parse(readFileSync(planFile, 'utf8'));
  assert.equal(plan.entries.find(e => e.path === '.promotion-agent/templates/WORKFLOW.md').action, 'update');
  const applied = spawnSync(process.execPath, [script, 'install', '--project', project, '--plan', planFile, '--review-hash', JSON.parse(preview.stdout).reviewHash], { encoding: 'utf8' });
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(readFileSync(join(project, '.promotion-agent/templates/WORKFLOW.md'), 'utf8'), 'New bundled workflow\n');
});

test('reviewed removal keeps product data and edited wrappers, and rejects stale plans', t => {
  const { project } = setup(t); install(project);
  const custom = join(project, '.claude/commands/promote.md');
  writeFileSync(custom, 'My custom command\n');
  const plan = previewRemoval(project);
  assert.equal(plan.entries.find(e => e.path === '.promotion-agent/templates/WORKFLOW.md').action, 'remove');
  assert.equal(plan.entries.find(e => e.path === '.claude/commands/promote.md').action, 'preserve');
  assert.throws(() => applyRemoval(project, plan, '0'.repeat(64)), /Review hash/);
  writeFileSync(join(project, '.opencode/commands/promote.md'), 'Changed after preview');
  assert.throws(() => applyRemoval(project, plan, removalHash(plan)), /Removal conflict/);
  assert.ok(existsSync(join(project, '.promotion-agent/templates/WORKFLOW.md')));
  const fresh = previewRemoval(project);
  const result = applyRemoval(project, fresh, removalHash(fresh));
  assert.ok(result.removed.includes('.promotion-agent/templates/WORKFLOW.md'));
  assert.equal(readFileSync(custom, 'utf8'), 'My custom command\n');
  assert.equal(readFileSync(join(project, '.opencode/commands/promote.md'), 'utf8'), 'Changed after preview');
  assert.ok(existsSync(join(project, 'promotion-agent.json')));
  assert.ok(existsSync(join(project, 'marketing/TASKS.md')));
  const manifest = JSON.parse(readFileSync(join(project, '.promotion-agent/manifest.json'), 'utf8'));
  assert.ok(manifest.files['.claude/commands/promote.md']);
  assert.equal(manifest.files['.promotion-agent/templates/WORKFLOW.md'], undefined);
});

test('unmodified installation removal leaves project data and supports reinstall', t => {
  const { project } = setup(t); install(project);
  const plan = previewRemoval(project);
  applyRemoval(project, plan, removalHash(plan));
  const ownership = JSON.parse(readFileSync(join(project, '.promotion-agent/manifest.json'), 'utf8'));
  assert.equal(ownership.files['.promotion-agent/templates/WORKFLOW.md'], undefined);
  assert.ok(ownership.files['promotion-agent.json']);
  assert.ok(!existsSync(join(project, '.agents/skills/promotion-agent/SKILL.md')));
  assert.ok(existsSync(join(project, 'promotion-agent.json')));
  assert.ok(existsSync(join(project, 'marketing/AGENT.md')));
  install(project);
  assert.ok(existsSync(join(project, '.agents/skills/promotion-agent/SKILL.md')));
});

test('stale plans and target substitution fail before any installation write', t => {
  const { project, dir } = setup(t);
  const plan = previewInstall(project, 'Name');
  writeFileSync(join(project, 'promotion-agent.json'), 'User edit');
  assert.throws(() => applyInstall(project, plan, reviewHash(plan)), /conflict/);
  assert.deepEqual(readdirSync(project), ['promotion-agent.json']);
  const other = join(dir, 'other'); mkdirSync(other);
  assert.throws(() => applyInstall(other, plan, reviewHash(plan)), /explicitly selected/);
  assert.deepEqual(readdirSync(other), []);
});

test('symlink escapes and traversal in a modified plan are rejected', t => {
  const { project, dir } = setup(t);
  const outside = join(dir, 'outside'); mkdirSync(outside);
  symlinkSync(outside, join(project, '.claude'), 'dir');
  assert.throws(() => previewInstall(project, 'Name'), /Symlink/);
  rmSync(join(project, '.claude'));
  const plan = previewInstall(project, 'Name');
  plan.entries[0].path = '../outside/injected';
  assert.throws(() => applyInstall(project, plan, reviewHash(plan)), /Invalid installation/);
  assert.deepEqual(readdirSync(outside), []);
});

test('a project relocates with stable UUID and compiled helpers run without original bundle or dependencies', t => {
  const { project, dir } = setup(t);
  const source = join(dir, 'standalone-dist'); cpSync('dist', source, { recursive: true });
  const script = join(source, 'scripts/promotion.mjs'); const planFile = join(dir, 'plan.json');
  const command = args => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: dir } });
  const preview = command(['onboard', '--project', project, '--name', 'Portable', '--plan', planFile]);
  assert.equal(preview.status, 0, preview.stderr);
  const result = command(['install', '--project', project, '--plan', planFile, '--review-hash', JSON.parse(preview.stdout).reviewHash]);
  assert.equal(result.status, 0, result.stderr);
  const id = inspectProject(project).project.id;
  rmSync(source, { recursive: true });
  const relocated = join(dir, 'relocated'); renameSync(project, relocated);
  const inspected = spawnSync(process.execPath, [join(relocated, '.promotion-agent/scripts/promotion.mjs'), 'inspect', '--project', '.'], { cwd: relocated, encoding: 'utf8', env: { ...process.env, PATH: dir } });
  assert.equal(inspected.status, 0, inspected.stderr);
  assert.equal(JSON.parse(inspected.stdout).project.id, id);
  assert.equal(JSON.parse(inspected.stdout).snapshot.classification, 'valid');
  writeFileSync(join(relocated, 'marketing/TASKS.md'), readFileSync(new URL('../examples/example-desk/marketing/TASKS.md', import.meta.url)));
  const installedCommand = args => spawnSync(process.execPath, [join(relocated, '.promotion-agent/scripts/promotion.mjs'), ...args],
    { cwd: relocated, encoding: 'utf8', env: { ...process.env, PATH: dir } });
  const prepared = installedCommand(['prepare', '--project', '.', '--task', 'T-001']);
  assert.equal(prepared.status, 0, prepared.stderr);
  const draft = installedCommand(['record', '--project', '.', '--task', 'T-001', '--expected-hash', JSON.parse(prepared.stdout).revision,
    '--outcome', 'draft', '--reference', 'marketing/AGENT.md', '--summary', 'Portable fixture draft']);
  assert.equal(draft.status, 0, draft.stderr);
  assert.ok(existsSync(join(relocated, JSON.parse(draft.stdout).path)));
});
