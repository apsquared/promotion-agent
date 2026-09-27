import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { contentHash } from '../core/task-snapshot.ts';
import { createProject } from '../core/contracts.ts';
import type { Project, LocalProject } from '../core/contracts.ts';
import { canonicalCheckout } from './files.ts';
import type { Store } from './store.ts';

type Mapping = { line: number; project: Project; local: LocalProject };

const nameHeaders = new Set(['project', 'product', 'name']);
const pathHeaders = new Set(['source', 'source dir', 'sourcedir', 'repo', 'repository', 'repo path', 'path', 'local path', 'source directory']);
function cells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim().replace(/^`(.*)`$/, '$1'));
}

/** Conservative Markdown project-table import. Unknown columns are ignored, never persisted. */
export function parseLegacyProjectTable(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const rows: { line: number; displayName: string; checkoutPath: string }[] = [];
  const diagnostics: string[] = [];
  let tableCount = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes('|')) continue;
    const header = cells(lines[i]).map(c => c.toLowerCase());
    const names = header.flatMap((h, index) => nameHeaders.has(h) ? [index] : []);
    const paths = header.flatMap((h, index) => pathHeaders.has(h) ? [index] : []);
    if (!names.length || !paths.length) continue;
    const separator = cells(lines[i + 1]);
    if (separator.length !== header.length || !separator.every(c => /^:?-{3,}:?$/.test(c))) continue;
    tableCount++;
    if (names.length !== 1 || paths.length !== 1) diagnostics.push(`Ambiguous table header on line ${i + 1}`);
    i += 2;
    for (; i < lines.length && lines[i].trim().includes('|'); i++) {
      const row = cells(lines[i]);
      if (row.length !== header.length || !row[names[0]] || !row[paths[0]] || lines[i].includes('\\|')) {
        diagnostics.push(`Malformed project row on line ${i + 1}`); continue;
      }
      rows.push({ line: i + 1, displayName: row[names[0]], checkoutPath: row[paths[0]] });
    }
    i--;
  }
  if (tableCount !== 1) diagnostics.push('Select a file with exactly one unambiguous project/path table');
  if (!rows.length) diagnostics.push('No project rows found');
  return { rows, diagnostics };
}

/** Preview tokens are process-local and bind exact source bytes and proposed UUID/path mappings. */
export class LegacyProjectImporter {
  #store: Store;
  #previews = new Map<string, { filename: string; hash: string; mappings: Mapping[]; diagnostics: string[] }>();
  constructor(store: Store) { this.#store = store; }
  preview(filename: string) {
    const source = resolve(filename);
    const bytes = readFileSync(source);
    const parsed = parseLegacyProjectTable(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    const known = this.#store.listProjects();
    const mappings: Mapping[] = [];
    const diagnostics = [...parsed.diagnostics];
    const seen = new Set<string>();
    for (const row of parsed.rows) {
      try {
        const input = row.checkoutPath.startsWith('~/') ? resolve(homedir(), row.checkoutPath.slice(2)) : row.checkoutPath;
        const path = canonicalCheckout(isAbsolute(input) ? input : resolve(dirname(source), input));
        if (seen.has(path)) throw new Error('Duplicate checkout path');
        seen.add(path);
        const existing = known.find(m => m.local.checkoutPath === path);
        const project = existing?.project ?? createProject(randomUUID(), row.displayName);
        const local: LocalProject = existing?.local ?? { schemaVersion: 1, projectId: project.id, checkoutPath: path, preferredAgent: null, credentialReferences: [] };
        mappings.push({ line: row.line, project, local });
      } catch (error) { diagnostics.push(`Line ${row.line}: ${(error as Error).message}`); }
    }
    const token = randomUUID();
    const hash = contentHash(bytes);
    this.#previews.set(token, { filename: source, hash, mappings, diagnostics });
    return { token, hash, rows: mappings.map(m => ({ line: m.line, projectId: m.project.id, displayName: m.project.displayName, checkoutPath: m.local.checkoutPath })), diagnostics: [...diagnostics] };
  }
  apply(token: string, selectedLines: number[]) {
    const preview = this.#previews.get(token);
    if (!preview) throw new Error('Unknown or consumed preview; preview again');
    if (preview.diagnostics.length) throw new Error('Invalid import preview');
    if (contentHash(readFileSync(preview.filename)) !== preview.hash) throw new Error('Import source changed; preview again');
    if (!Array.isArray(selectedLines) || !selectedLines.length || new Set(selectedLines).size !== selectedLines.length) throw new Error('Select unique preview row numbers');
    const selected = selectedLines.map(line => {
      const mapping = preview.mappings.find(m => m.line === line);
      if (!mapping) throw new Error('Selected row is not in this preview');
      if (canonicalCheckout(mapping.local.checkoutPath) !== mapping.local.checkoutPath) throw new Error('Checkout changed; preview again');
      return mapping;
    });
    const result = this.#store.registerSelected(selected);
    this.#previews.delete(token);
    return result;
  }
}
