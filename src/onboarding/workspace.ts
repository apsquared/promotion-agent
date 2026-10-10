import { existsSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalCheckout, taskFile } from '../storage/files.ts';

export const sourceFile = 'promotion-source.json';
export type SourceRegistration = { version: 1; mode: 'observer'; sourcePath: string };

function contained(parent: string, child: string) {
  const path = relative(parent, child);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

export function observerSource(workspace: string, product: string): SourceRegistration {
  const root = canonicalCheckout(workspace);
  const sourcePath = canonicalCheckout(product);
  if (contained(sourcePath, root) || contained(root, sourcePath))
    throw new Error('Promotion workspace and observed repository must be separate, non-overlapping directories');
  return { version: 1, mode: 'observer', sourcePath };
}

/** Local machine mapping lives only in the private promotion workspace. */
export function readSource(workspace: string): SourceRegistration | null {
  const root = canonicalCheckout(workspace);
  if (!existsSync(join(root, sourceFile))) return null;
  return validateSource(root, JSON.parse(readFileSync(taskFile(root, sourceFile), 'utf8')));
}

export function validateSource(workspace: string, value: any): SourceRegistration {
  const root = canonicalCheckout(workspace);
  if (!value || value.version !== 1 || value.mode !== 'observer' || typeof value.sourcePath !== 'string' ||
      !isAbsolute(value.sourcePath) || Object.keys(value).some(key => !['version', 'mode', 'sourcePath'].includes(key)))
    throw new Error('Invalid observer registration');
  const validated = observerSource(root, value.sourcePath);
  if (validated.sourcePath !== value.sourcePath) throw new Error('Observed repository mapping changed; review registration again');
  return validated;
}

export function requireWorkspace(workspace: string) {
  const source = readSource(workspace);
  if (!source) throw new Error('Select a registered promotion workspace, not the product repository');
  return source;
}

/** Reject databases/plans inside the source, including paths through symlink ancestors. */
export function assertObserverOutput(workspace: string, output: string) {
  const source = readSource(workspace);
  if (!source) return; // Legacy library callers remain compatible; CLI requires registration.
  assertOutput(source.sourcePath, output);
}

export function assertObserverOutputForSetup(workspace: string, product: string, output: string) {
  assertOutput(observerSource(workspace, product).sourcePath, output);
}

function assertOutput(sourcePath: string, output: string) {
  const target = resolve(output);
  let ancestor = target;
  while (!existsSync(ancestor)) {
    try { if (lstatSync(ancestor).isSymbolicLink()) throw new Error('Dangling output symlink'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    if (ancestor === dirname(ancestor)) throw new Error('Cannot resolve output parent');
    ancestor = dirname(ancestor);
  }
  // realpath resolves existing symlink ancestors; dangling links must fail closed.
  const actual = resolve(realpathSync(ancestor), relative(ancestor, target));
  if (contained(sourcePath, actual) || contained(actual, sourcePath))
    throw new Error('Observer bookkeeping outputs cannot be in or contain the product repository');
}
