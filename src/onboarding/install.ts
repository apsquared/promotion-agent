import { readFileSync, writeFileSync, lstatSync, mkdirSync, readdirSync, renameSync, unlinkSync, rmdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createProject } from '../core/contracts.ts';
import { contentHash } from '../core/task-snapshot.ts';
import { canonicalCheckout } from '../storage/files.ts';
import { projectSchema, relativePath } from '../../schemas/contracts.ts';

const manifestPath = '.promotion-agent/manifest.json';
type Manifest = { version: 1; files: Record<string, string> };
export type InstallEntry = { path: string; before: string | null; after: string; action: 'create' | 'update' | 'preserve'; reason: string };
export type InstallPlan = { version: 1; root: string; entries: InstallEntry[] };
export type RemovalEntry = { path: string; before: string; action: 'remove' | 'preserve'; reason: string };
export type RemovalPlan = { version: 1; root: string; entries: RemovalEntry[]; manifestBefore: string; manifestAfter: string | null };
const digest = /^[a-f0-9]{64}$/;

/** Validate every existing component, including directories that have yet to contain files. */
function safePath(root: string, path: string) {
  relativePath.parse(path);
  if (path.split('/').some(part => part === '.git')) throw new Error('Git internals cannot be installation targets');
  let result = root;
  for (const [index, part] of path.split('/').entries()) {
    result = join(result, part);
    try {
      const stat = lstatSync(result);
      if (stat.isSymbolicLink()) throw new Error(`Symlink installation path: ${path}`);
      if (index < path.split('/').length - 1 && !stat.isDirectory()) throw new Error(`Not a directory: ${path}`);
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return result;
}
function read(root: string, path: string): string | null {
  const file = safePath(root, path);
  try {
    if (!lstatSync(file).isFile()) throw new Error(`Not a regular installation file: ${path}`);
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(readFileSync(file));
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
}
function manifest(text: string | null): Manifest {
  if (text === null) return { version: 1, files: {} };
  const value = JSON.parse(text);
  if (value.version !== 1 || !value.files || typeof value.files !== 'object' || Array.isArray(value.files) || Object.keys(value).some(k => !['version', 'files'].includes(k))) throw new Error('Invalid installation manifest');
  for (const [path, hash] of Object.entries(value.files)) {
    relativePath.parse(path);
    if (typeof hash !== 'string' || !digest.test(hash)) throw new Error('Invalid manifest file hash');
  }
  return value;
}
function walk(root: string, subpath: string): string[] {
  return readdirSync(join(root, subpath), { withFileTypes: true }).flatMap(entry => {
    const path = `${subpath}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error('Bundle cannot contain symlinks');
    return entry.isDirectory() ? walk(root, path) : entry.isFile() ? [path] : [];
  });
}

/** Uses compiled code and resources from the local build, never another product checkout. */
function distribution() {
  const moduleRoot = fileURLToPath(new URL('../../', import.meta.url));
  const root = import.meta.url.endsWith('.ts') ? join(moduleRoot, 'dist') : moduleRoot;
  const files: Record<string, string> = {};
  for (const path of [...walk(root, 'src'), ...walk(root, 'schemas'), ...walk(root, 'scripts'), ...walk(root, 'templates'), ...walk(root, 'docs'), 'package.json', 'LICENSE']) {
    files[`.promotion-agent/${path}`] = readFileSync(join(root, path), 'utf8');
  }
  return { root, files };
}
function wrappers(): Record<string, string> {
  const instructions = 'Follow `.promotion-agent/templates/WORKFLOW.md` in this project. Work in the CURRENT interactive session using its available tools and existing authorization. Do not launch AI CLIs, check provider authentication, switch models, or delegate. The selected project is this checkout unless the user explicitly selects another. Read its existing instructions and marketing context. Local helper usage is in `.promotion-agent/docs/INSTALLED.md`. Treat arguments as task data, never shell code.';
  return {
    '.agents/skills/promotion-agent/SKILL.md': `---\nname: promotion-agent\ndescription: Prepare and review marketing work for this selected product using its facts, tasks and logs in the current interactive session.\n---\n\nRead [the shared workflow](../../../.promotion-agent/templates/WORKFLOW.md) and [local helper instructions](../../../.promotion-agent/docs/INSTALLED.md).\n\n${instructions}\n`,
    '.claude/commands/promote.md': `---\ndescription: Prepare and review marketing work in the current interactive session\nargument-hint: [activity or task ID]\n---\n\n${instructions}\n\nUser request: $ARGUMENTS\n`,
    '.opencode/commands/promote.md': `---\ndescription: Prepare and review marketing work in the current interactive session\n---\n\n${instructions}\n\nUser request: $ARGUMENTS\n`,
  };
}
const installedGuide = `# Installed interactive workflow

This project carries its own shared workflow and compiled local helpers. No original promotion-agent checkout, package install, server or AI CLI is needed; Node 22.14+ is required for helpers.

In the current session use $promotion-agent (Codex), /promote (Claude/OpenCode), or read .promotion-agent/templates/WORKFLOW.md directly. Native menu discovery is host-owned.

From this project root:

    node .promotion-agent/scripts/promotion.mjs inspect --project .
    node .promotion-agent/scripts/promotion.mjs prepare --project . --task T-001

After preparing a task-linked draft, optionally record its existing local artifact (no database):

    node .promotion-agent/scripts/promotion.mjs record --project . --task T-001 --expected-hash REVIEWED_TASK_HASH --outcome draft --reference marketing/drafts/example.md --summary "Draft prepared for review"

Only after you have independently verified the completed action, record the evidence and use the returned path/hash:

    node .promotion-agent/scripts/promotion.mjs record --project . --task T-001 --expected-hash REVIEWED_TASK_HASH --outcome verified-complete --reference https://example.com/receipt --summary "Verified receipt and destination"
    node .promotion-agent/scripts/promotion.mjs complete --project . --task T-001 --expected-hash REVIEWED_TASK_HASH --database /chosen/private/state.sqlite --evidence RETURNED_RECORD_PATH --evidence-hash RETURNED_RECORD_HASH

For local skipped/snoozed state, use state and disposition with the same chosen database; drafts do not need one. Snoozing requires a reason and future UTC until timestamp.

Use one consistent private database per portfolio for shared locks. Source files own facts and completion. The helper validates the evidence account and source hashes but does not verify external actions. Existing AGENTS.md/CLAUDE.md and product-specific overrides remain authoritative within user scope.

For upgrade, run onboarding from a newer built promotion-agent checkout, review the new plan, and apply its hash. Locally edited or unmanaged files are preserved, including customized workflows/commands. Configuration, context, task queues and logs are created only when absent and never upgraded automatically. Review any preserved runtime customization for compatibility yourself. To relocate, move this whole project: all installed references are relative, and the project UUID stays in promotion-agent.json. Optional database registry relocation is still explicit.

For removal, use a promotion-agent package or checkout outside this project to run remove-preview --project . --plan /private/path/removal.json, review the reported paths and hash, then remove --project . --plan /private/path/removal.json --review-hash HASH. This removes only unchanged managed runtime files and wrappers. Product configuration, marketing facts, tasks, logs, custom wrappers and optional local databases remain. Empty directories and the manifest tracking retained product files may remain; inspect them before any manual cleanup.
`;

export function previewInstall(directory: string, name: string): InstallPlan {
  const root = canonicalCheckout(directory);
  const oldManifest = manifest(read(root, manifestPath));
  const existingConfig = read(root, 'promotion-agent.json');
  const project = existingConfig === null ? createProject(randomUUID(), name) : projectSchema.parse(JSON.parse(existingConfig));
  const bundle = distribution();
  const desired: Record<string, string> = { ...bundle.files, ...wrappers(), 'promotion-agent.json': JSON.stringify(project, null, 2) + '\n' };
  desired['.promotion-agent/docs/INSTALLED.md'] = installedGuide;
  // Seed product-owned templates only at the default paths; custom configuration remains untouched.
  for (const path of walk(bundle.root, 'templates/marketing')) {
    const target = path.slice('templates/'.length);
    if (target === 'marketing/AGENT.md' && project.contextPath !== target) continue;
    if (target === 'marketing/TASKS.md' && project.tasksPath !== target) continue;
    desired[target] = readFileSync(join(bundle.root, path), 'utf8');
  }
  const entries: InstallEntry[] = [];
  const owned = { ...oldManifest.files };
  for (const [path, after] of Object.entries(desired).sort(([a], [b]) => a.localeCompare(b))) {
    const before = read(root, path);
    const hash = before === null ? null : contentHash(before);
    const productOwned = path === 'promotion-agent.json' || path.startsWith('marketing/');
    const action = before === null ? 'create' : !productOwned && oldManifest.files[path] === hash && before !== after ? 'update' : 'preserve';
    const reason = before === null ? 'New file' : before === after ? 'Already current' : productOwned ? 'Product-owned content' : oldManifest.files[path] === hash ? 'Unmodified managed file' : 'Existing or locally customized file';
    entries.push({ path, before, after: action === 'preserve' ? before! : after, action, reason });
    if (action !== 'preserve') owned[path] = contentHash(after);
  }
  const before = read(root, manifestPath);
  const after = JSON.stringify({ version: 1, files: owned }, null, 2) + '\n';
  entries.push({ path: manifestPath, before, after, action: before === after ? 'preserve' : before === null ? 'create' : 'update', reason: 'Installation ownership hashes; no machine paths or credentials' });
  return { version: 1, root, entries };
}
export function reviewHash(plan: InstallPlan): string { return contentHash(JSON.stringify(plan)); }

/** Remove only unchanged installer-owned infrastructure. Product data remains in the project. */
export function previewRemoval(directory: string): RemovalPlan {
  const root = canonicalCheckout(directory);
  const manifestBefore = read(root, manifestPath);
  if (manifestBefore === null) throw new Error('No promotion-agent installation manifest');
  const ownership = manifest(manifestBefore);
  const wrapperPaths = new Set(Object.keys(wrappers()));
  const entries: RemovalEntry[] = [];
  const retained = { ...ownership.files };
  for (const path of Object.keys(ownership.files).sort()) {
    if (path === manifestPath || (!path.startsWith('.promotion-agent/') && !wrapperPaths.has(path))) continue;
    const before = read(root, path);
    if (before === null) { delete retained[path]; continue; }
    const action = contentHash(before) === ownership.files[path] ? 'remove' : 'preserve';
    entries.push({ path, before, action, reason: action === 'remove' ? 'Unchanged installer-owned file' : 'Locally edited file' });
    if (action === 'remove') delete retained[path];
  }
  const manifestAfter = Object.keys(retained).length === 0 ? null : JSON.stringify({ version: 1, files: retained }, null, 2) + '\n';
  return { version: 1, root, entries, manifestBefore, manifestAfter };
}
export function removalHash(plan: RemovalPlan): string { return contentHash(JSON.stringify(plan)); }

export function applyRemoval(directory: string, plan: RemovalPlan, expectedReviewHash: string) {
  const root = canonicalCheckout(directory);
  if (!digest.test(expectedReviewHash) || removalHash(plan) !== expectedReviewHash) throw new Error('Review hash mismatch; preview again');
  if (plan.version !== 1 || plan.root !== root || !Array.isArray(plan.entries)) throw new Error('Plan does not match the explicitly selected project');
  const owned = manifest(plan.manifestBefore).files;
  const wrapperPaths = new Set(Object.keys(wrappers()));
  const retained = { ...owned };
  const seen = new Set<string>();
  for (const entry of plan.entries) {
    if (seen.has(entry.path) || entry.path === manifestPath || (!entry.path.startsWith('.promotion-agent/') && !wrapperPaths.has(entry.path)) ||
      !Object.hasOwn(owned, entry.path) || !['remove', 'preserve'].includes(entry.action) || typeof entry.before !== 'string') throw new Error('Invalid removal entry');
    seen.add(entry.path);
    if (entry.action === 'remove') {
      if (contentHash(entry.before) !== owned[entry.path]) throw new Error('Plan cannot remove a customized file');
      delete retained[entry.path];
    }
  }
  for (const path of Object.keys(owned)) {
    if ((path.startsWith('.promotion-agent/') || wrapperPaths.has(path)) && read(root, path) !== null && !seen.has(path)) throw new Error('Removal plan omits a managed file');
    if ((path.startsWith('.promotion-agent/') || wrapperPaths.has(path)) && read(root, path) === null) delete retained[path];
  }
  const expectedAfter = Object.keys(retained).length === 0 ? null : JSON.stringify({ version: 1, files: retained }, null, 2) + '\n';
  if (plan.manifestAfter !== expectedAfter) throw new Error('Removal manifest does not match its entries');
  const lock = join(root, '.promotion-agent-install.lock');
  mkdirSync(lock, { mode: 0o700 });
  const removed: RemovalEntry[] = [];
  try {
    if (read(root, manifestPath) !== plan.manifestBefore) throw new Error('Removal conflict: manifest; preview again');
    for (const entry of plan.entries) if (read(root, entry.path) !== entry.before) throw new Error(`Removal conflict: ${entry.path}; preview again`);
    for (const entry of plan.entries.filter(e => e.action === 'remove')) {
      unlinkSync(safePath(root, entry.path)); removed.push(entry);
    }
    if (plan.manifestAfter === null) unlinkSync(safePath(root, manifestPath));
    else writeFileSync(safePath(root, manifestPath), plan.manifestAfter);
    return { removed: removed.map(e => e.path), preserved: plan.entries.filter(e => e.action === 'preserve').map(e => ({ path: e.path, reason: e.reason })), productDataPreserved: true };
  } catch (error) {
    for (const entry of removed.reverse()) if (read(root, entry.path) === null) writeFileSync(safePath(root, entry.path), entry.before, { flag: 'wx' });
    if (read(root, manifestPath) !== plan.manifestBefore) writeFileSync(safePath(root, manifestPath), plan.manifestBefore);
    throw error;
  } finally { rmdirSync(lock); }
}

export function applyInstall(directory: string, plan: InstallPlan, expectedReviewHash: string) {
  const root = canonicalCheckout(directory);
  if (!digest.test(expectedReviewHash) || reviewHash(plan) !== expectedReviewHash) throw new Error('Review hash mismatch; preview again');
  if (plan.version !== 1 || plan.root !== root || !Array.isArray(plan.entries)) throw new Error('Plan does not match the explicitly selected project');
  const bundle = distribution();
  const allowed = new Set([...Object.keys(bundle.files), ...Object.keys(wrappers()), '.promotion-agent/docs/INSTALLED.md', 'promotion-agent.json', manifestPath,
    ...walk(bundle.root, 'templates/marketing').map(path => path.slice('templates/'.length))]);
  const seen = new Set<string>();
  for (const entry of plan.entries) {
    if (!allowed.has(entry.path) || seen.has(entry.path) || !['create', 'update', 'preserve'].includes(entry.action) || typeof entry.after !== 'string' || (entry.before !== null && typeof entry.before !== 'string')) throw new Error('Invalid installation entry');
    seen.add(entry.path);
    if ((entry.action === 'create' && entry.before !== null) || (entry.action === 'update' && entry.before === null) || (entry.action === 'preserve' && entry.after !== entry.before)) throw new Error('Invalid installation action');
  }
  const ownership = manifest(read(root, manifestPath));
  const nextOwnership = { ...ownership.files };
  for (const entry of plan.entries) {
    if (entry.path === manifestPath) continue;
    if (entry.action === 'update' && (entry.path === 'promotion-agent.json' || entry.path.startsWith('marketing/') || ownership.files[entry.path] !== contentHash(entry.before!))) throw new Error('Plan cannot overwrite product-owned or customized files');
    if (entry.action !== 'preserve') nextOwnership[entry.path] = contentHash(entry.after);
    if (entry.path === 'promotion-agent.json') projectSchema.parse(JSON.parse(entry.after));
  }
  const ownershipEntry = plan.entries.find(e => e.path === manifestPath);
  if (!ownershipEntry || JSON.stringify(manifest(ownershipEntry.after).files) !== JSON.stringify(nextOwnership)) throw new Error('Plan ownership record does not match its writes');
  const lock = join(root, '.promotion-agent-install.lock');
  mkdirSync(lock, { mode: 0o700 });
  const changed: InstallEntry[] = [];
  try {
    for (const entry of plan.entries) if (read(root, entry.path) !== entry.before) throw new Error(`Installation conflict: ${entry.path}; preview again`);
    for (const entry of plan.entries.filter(e => e.action !== 'preserve')) {
      const target = safePath(root, entry.path);
      mkdirSync(dirname(target), { recursive: true });
      if (read(root, entry.path) !== entry.before) throw new Error(`Installation conflict: ${entry.path}`);
      if (entry.action === 'create') writeFileSync(target, entry.after, { flag: 'wx' });
      else {
        const temporary = `${target}.${randomUUID()}.tmp`;
        try { writeFileSync(temporary, entry.after, { flag: 'wx', mode: lstatSync(target).mode & 0o777 }); renameSync(temporary, target); }
        finally { try { unlinkSync(temporary); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; } }
      }
      changed.push(entry);
    }
    for (const entry of changed) if (read(root, entry.path) !== entry.after) throw new Error('Installation read-back failed');
    return { changed: changed.map(e => e.path), preserved: plan.entries.filter(e => e.action === 'preserve').map(e => ({ path: e.path, reason: e.reason })) };
  } catch (error) {
    // Roll back only our own still-unchanged writes; never erase a concurrent editor's content.
    for (const entry of changed.reverse()) {
      if (read(root, entry.path) !== entry.after) continue;
      const target = safePath(root, entry.path);
      if (entry.before === null) unlinkSync(target); else writeFileSync(target, entry.before);
    }
    throw error;
  } finally { rmdirSync(lock); }
}
