import { constants, closeSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, renameSync, rmdirSync, statSync, unlinkSync, writeFileSync, fchmodSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { relativePath, uuid } from '../../schemas/contracts.ts';
import { contentHash, completeTaskText, strictTaskSnapshot } from '../core/task-snapshot.ts';

export class ConflictError extends Error {}
export class ProjectLockedError extends Error {}

export function canonicalCheckout(path: string): string {
  const root = realpathSync(path);
  if (!statSync(root).isDirectory()) throw new Error('Checkout must be a directory');
  return root;
}

/** Reject symlink components, including in-repo links, to keep write targets unambiguous. */
export function taskFile(root: string, path: string): string {
  relativePath.parse(path);
  if (canonicalCheckout(root) !== root) throw new Error('Checkout mapping changed; register its current canonical path');
  let target = root;
  for (const part of path.split('/')) {
    target = join(target, part);
    if (lstatSync(target).isSymbolicLink()) throw new Error('Symlink task paths are not supported');
  }
  const resolved = realpathSync(target);
  const rel = relative(root, resolved);
  if (rel === '..' || rel.startsWith(`..${sep}`) || resolved === root || !statSync(resolved).isFile()) throw new Error('Task path is not a contained regular file');
  return resolved;
}

export function readTaskFile(root: string, path: string) {
  try {
    const target = taskFile(root, path);
    const data = readFileSync(target);
    // fatal UTF-8 prevents replacement characters from corrupting source on write-back.
    const markdown = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(data);
    const snapshot = strictTaskSnapshot(markdown);
    return { classification: snapshot.canReconcile ? 'valid' : 'invalid', hash: contentHash(data), markdown, diagnostics: snapshot.diagnostics, tasks: snapshot.tasks };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return { classification: code === 'ENOENT' ? 'missing' : 'unreadable', hash: null, markdown: null, tasks: [], diagnostics: [(error as Error).message] };
  }
}

/** Cooperative cross-process locks; stale locks deliberately require explicit operator recovery. */
export function withProjectLock<T>(lockRoot: string, projectId: string, action: () => T): T {
  uuid.parse(projectId);
  mkdirSync(lockRoot, { recursive: true, mode: 0o700 });
  const lock = join(lockRoot, `${projectId}.lock`);
  try { mkdirSync(lock, { mode: 0o700 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new ProjectLockedError('Project is locked; retry after the current operation or inspect a stale lock');
    throw error;
  }
  try {
    writeFileSync(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
    return action();
  } finally {
    try { unlinkSync(join(lock, 'owner.json')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    rmdirSync(lock);
  }
}

/** Caller holds the project lock. Recheck after staging and before same-directory rename. */
export function writeCompletedTask(root: string, path: string, taskId: string, expectedHash: string) {
  const before = readTaskFile(root, path);
  if (before.classification !== 'valid') throw new Error(`Cannot edit ${before.classification} snapshot`);
  if (before.hash !== expectedHash) throw new ConflictError('Task file changed; rescan and review before retrying');
  const target = taskFile(root, path);
  const next = completeTaskText(before.markdown!, taskId);
  if (next === before.markdown) return before;
  const temp = join(dirname(target), `.promotion-agent-${randomUUID()}.tmp`);
  const original = statSync(target);
  let fd: number | undefined;
  try {
    fd = openSync(temp, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    writeFileSync(fd, next, 'utf8');
    fchmodSync(fd, original.mode & 0o777);
    fsyncSync(fd); closeSync(fd); fd = undefined;
    const latest = readTaskFile(root, path);
    const current = statSync(taskFile(root, path));
    if (latest.classification !== 'valid' || latest.hash !== expectedHash || current.ino !== original.ino || current.dev !== original.dev) throw new ConflictError('Task file changed while staging edit');
    renameSync(temp, target);
    const verified = readTaskFile(root, path);
    if (verified.classification !== 'valid' || verified.hash !== contentHash(next)) throw new ConflictError('Write read-back differs; rescan before retrying');
    return verified;
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temp); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
}
