import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { relativePath, taskEvidenceSchema, uuid } from '../../schemas/contracts.ts';
import type { TaskEvidence } from '../core/contracts.ts';
import { contentHash } from '../core/task-snapshot.ts';
import { canonicalCheckout, taskFile } from '../storage/files.ts';

const evidenceDirectory = 'marketing/logs/promotion-agent';

/** URLs are pointers for the interactive agent to verify, never network proofs from this helper. */
export function evidenceReference(root: string, reference: string) {
  if (reference.startsWith('https://')) {
    const url = new URL(reference);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash) throw new Error('Evidence URL must be HTTPS without credentials, query or fragment');
    return { reference: url.href, sha256: null };
  }
  relativePath.parse(reference);
  return { reference, sha256: contentHash(readFileSync(taskFile(canonicalCheckout(root), reference))) };
}

function ensureEvidenceDirectory(root: string) {
  let current = root;
  for (const part of evidenceDirectory.split('/')) {
    current = join(current, part);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe evidence directory: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      mkdirSync(current, { mode: 0o700 });
    }
  }
  return current;
}

export function saveEvidence(root: string, input: Omit<TaskEvidence, 'id' | 'recordedAt'>) {
  root = canonicalCheckout(root);
  const record = taskEvidenceSchema.parse({ ...input, id: randomUUID(), recordedAt: new Date().toISOString() });
  const source = evidenceReference(root, record.reference);
  if (source.reference !== record.reference || source.sha256 !== record.referenceSha256) throw new Error('Evidence reference is not current');
  const directory = ensureEvidenceDirectory(root);
  const path = `${evidenceDirectory}/${record.id}.json`;
  const bytes = JSON.stringify(record, null, 2) + '\n';
  writeFileSync(join(directory, `${record.id}.json`), bytes, { flag: 'wx', mode: 0o600 });
  const saved = readEvidence(root, path);
  if (saved.hash !== contentHash(bytes)) throw new Error('Evidence read-back failed');
  return { path, hash: saved.hash, record };
}

export function readEvidence(root: string, path: string) {
  root = canonicalCheckout(root);
  relativePath.parse(path);
  const prefix = `${evidenceDirectory}/`;
  if (!path.startsWith(prefix) || !/^([0-9a-f-]+)\.json$/.test(path.slice(prefix.length))) throw new Error('Evidence path must be a project-local promotion-agent record');
  uuid.parse(path.slice(prefix.length, -'.json'.length));
  const bytes = readFileSync(taskFile(root, path));
  const record = taskEvidenceSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)));
  if (path !== `${prefix}${record.id}.json`) throw new Error('Evidence filename does not match record ID');
  const reference = evidenceReference(root, record.reference);
  if (reference.reference !== record.reference || reference.sha256 !== record.referenceSha256) throw new Error('Evidence reference changed; review again');
  return { record, hash: contentHash(bytes) };
}
