import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { previewInstall, applyInstall, reviewHash, previewRemoval, applyRemoval, removalHash } from '../src/onboarding/install.ts';

const activity = 'templates/activities/promotion-opportunities/WORKFLOW.md';
const sources = 'templates/activities/promotion-opportunities/SOURCES.md';
const entrypoints = ['.agents/skills/promotion-opportunities/SKILL.md', '.claude/commands/promote-opportunities.md', '.opencode/commands/promote-opportunities.md'];
function links(file) {
  return [...readFileSync(file, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .filter(([, href]) => !/^[a-z]+:/i.test(href)).map(([, href]) => resolve(dirname(file), href));
}
function verifyLinks(file, expected) {
  const found = links(file);
  if (expected) assert.ok(found.includes(expected), `Qualification procedure not reachable from ${file}`);
  for (const link of found) assert.ok(existsSync(link), `Missing resource: ${link}`);
}

// Packaging and ownership only: this test makes no external requests and cannot
// establish that an agent's real-world quality or availability judgment is true.
test('opportunity qualification ships across hosts, survives relocation and preserves customized resources', t => {
  const root = mkdtempSync(join(tmpdir(), 'promotion-opportunities-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, 'workspace');
  cpSync('examples/example-desk', project, { recursive: true });
  const originalTasks = readFileSync(join(project, 'marketing/TASKS.md'), 'utf8');
  for (const path of [...entrypoints, '.claude/skills/promotion-opportunities/SKILL.md', 'templates/WORKFLOW.md'])
    verifyLinks(resolve(path), resolve(activity));
  verifyLinks(resolve(activity));
  verifyLinks(resolve(sources));

  const plan = previewInstall(project, 'Ignored existing name');
  applyInstall(project, plan, reviewHash(plan));
  const moved = join(root, 'relocated-workspace');
  renameSync(project, moved);
  const installedActivity = join(moved, '.promotion-agent', activity);
  for (const path of entrypoints) verifyLinks(join(moved, path), installedActivity);
  for (const path of [activity, sources]) {
    const installed = join(moved, '.promotion-agent', path);
    assert.equal(readFileSync(installed, 'utf8'), readFileSync(path, 'utf8'));
    verifyLinks(installed);
  }

  const customized = [join(moved, entrypoints[0]), installedActivity];
  for (const file of customized) writeFileSync(file, 'User-customized opportunity guidance\n');
  const upgrade = previewInstall(moved, 'Ignored');
  for (const file of [entrypoints[0], `.promotion-agent/${activity}`])
    assert.equal(upgrade.entries.find(entry => entry.path === file).action, 'preserve');
  applyInstall(moved, upgrade, reviewHash(upgrade));
  const removal = previewRemoval(moved);
  applyRemoval(moved, removal, removalHash(removal));
  for (const file of customized) assert.equal(readFileSync(file, 'utf8'), 'User-customized opportunity guidance\n');
  for (const path of entrypoints.slice(1)) assert.equal(existsSync(join(moved, path)), false);
  assert.equal(readFileSync(join(moved, 'marketing/TASKS.md'), 'utf8'), originalTasks);
});
