import { DatabaseSync } from 'node:sqlite';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { inspectProject } from '../interactive/tasks.ts';
import { taskFile } from '../storage/files.ts';
import { contentHash } from '../core/task-snapshot.ts';
import { taskEvidenceSchema } from '../../schemas/contracts.ts';
import type { TaskEvidence, TaskDisposition } from '../core/contracts.ts';
import type { PromptTask } from '../core/task-prompt.ts';
import { DATABASE_VERSION } from '../storage/migrations.ts';

export type ReviewEvidence = TaskEvidence & {
  path: string;
  hash: string;
  currentRevision: boolean;
  preview: { text: string | null; status: string };
};
export type ReviewTask = Omit<PromptTask, 'project'> & {
  status: string;
  disposition: TaskDisposition | null;
  assignee: string | null;
  evidence: ReviewEvidence[];
};

const maxPreviewBytes = 256 * 1024;

function preview(root: string, path: string, expectedHash: string | null) {
  try {
    const file = taskFile(root, path);
    if (lstatSync(file).size > maxPreviewBytes)
      return { text: null, status: 'Too large to preview; review in the agent.' };
    const bytes = readFileSync(file);
    const matches = expectedHash !== null && contentHash(bytes) === expectedHash;
    const isText = ['.md', '.txt', '.json', '.csv', '.html'].includes(extname(path).toLowerCase());
    return {
      text: isText ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : null,
      status: matches ? 'Matches recorded hash' : 'Changed since recorded — review again',
    };
  } catch {
    return { text: null, status: 'File unavailable or unsafe to preview' };
  }
}

/** Read a single selected project. Never reconcile, migrate, or discover other checkouts. */
export function reviewData(directory: string, database?: string) {
  const { root, project, snapshot } = inspectProject(directory);
  const warnings: string[] = [];
  const registry: {
    status: string;
    path: string | null;
    lastImport: unknown;
    tasks: any[];
    records: any[];
  } = {
    status: database ? 'absent' : 'not selected',
    path: database ? resolve(database) : null,
    lastImport: null,
    tasks: [],
    records: [],
  };
  if (database && existsSync(database)) {
    let db: DatabaseSync | undefined;
    try {
      db = new DatabaseSync(resolve(database), { readOnly: true });
      db.exec('PRAGMA query_only = ON; PRAGMA busy_timeout = 1000; BEGIN');
      if (db.prepare('PRAGMA user_version').get()!.user_version !== DATABASE_VERSION)
        throw new Error('Unsupported database version');
      const registered = db
        .prepare('SELECT checkout_path FROM projects WHERE id=?')
        .get(project.id);
      registry.status = registered ? 'registered' : 'unregistered';
      if (registered && registered.checkout_path !== root)
        throw new Error(
          'Database checkout differs; relocate the registration explicitly in the agent',
        );
      if (registered) {
        registry.tasks = db
          .prepare(
            `SELECT t.payload,t.archived,s.disposition,s.assignee FROM tasks t LEFT JOIN task_state s
          ON t.project_id=s.project_id AND t.task_id=s.task_id WHERE t.project_id=? ORDER BY t.task_id`,
          )
          .all(project.id)
          .map((row) => ({
            ...JSON.parse(String(row.payload)),
            archived: row.archived === 1,
            disposition: row.disposition ? JSON.parse(String(row.disposition)) : null,
            assignee: row.assignee ?? null,
          }));
        registry.records = db
          .prepare('SELECT kind,id,payload FROM records WHERE project_id=? ORDER BY kind,id')
          .all(project.id)
          .map((row) => ({
            kind: String(row.kind),
            id: String(row.id),
            value: JSON.parse(String(row.payload)),
          }));
        const imported = db
          .prepare('SELECT classification,hash,observed_at FROM imports WHERE project_id=?')
          .get(project.id);
        registry.lastImport = imported ?? null;
        if (imported?.hash !== snapshot.hash)
          warnings.push(
            'The database task snapshot is out of date. Current project files are shown; refresh does not write to the database.',
          );
      }
      db.exec('COMMIT');
    } catch (error) {
      registry.status = 'unavailable';
      registry.tasks = [];
      registry.records = [];
      warnings.push(`Database: ${(error as Error).message}`);
    } finally {
      db?.close();
    }
  }
  const evidence: ReviewEvidence[] = [];
  // Walk only the known evidence directory, rejecting all symlink components.
  let evidenceDir = root;
  try {
    for (const part of ['marketing', 'logs', 'promotion-agent']) {
      evidenceDir = join(/* turbopackIgnore: true */ evidenceDir, part);
      const stat = lstatSync(evidenceDir);
      if (stat.isSymbolicLink() || !stat.isDirectory())
        throw new Error('Unsafe evidence directory');
    }
    for (const name of readdirSync(/* turbopackIgnore: true */ evidenceDir)
      .filter((name) => name.endsWith('.json'))
      .sort()) {
      const path = `marketing/logs/promotion-agent/${name}`;
      try {
        const file = taskFile(root, path);
        if (lstatSync(file).size > maxPreviewBytes) throw new Error('Evidence record too large');
        const bytes = readFileSync(file);
        const record = taskEvidenceSchema.parse(JSON.parse(bytes.toString('utf8')));
        if (record.projectId !== project.id || name !== `${record.id}.json`)
          throw new Error('Evidence identity mismatch');
        evidence.push({
          path,
          hash: contentHash(bytes),
          ...record,
          currentRevision: record.taskHash === snapshot.hash,
          preview: record.reference.startsWith('https://')
            ? {
                text: null,
                status: 'External reference — not independently verified by this screen',
              }
            : preview(root, record.reference, record.referenceSha256),
        });
      } catch {
        warnings.push(`Cannot review evidence record ${name}; ask the agent to inspect it.`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      warnings.push('Evidence directory unavailable or unsafe to read.');
  }
  evidence.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const tasks: ReviewTask[] = snapshot.tasks.map((task) => {
    const stored = registry.tasks.find((row) => row.taskId === task.taskId);
    return {
      ...task,
      disposition: stored?.disposition ?? null,
      assignee: stored?.assignee ?? null,
      evidence: evidence.filter((row) => row.taskId === task.taskId),
    };
  });
  const records = registry.records.map((row) => ({
    ...row,
    preview: row.kind === 'artifact' ? preview(root, row.value.path, row.value.sha256) : null,
  }));
  return {
    project: {
      id: project.id,
      displayName: project.displayName,
      root,
      tasksPath: project.tasksPath,
      policy: project.policy,
    },
    revision: snapshot.hash,
    classification: snapshot.classification,
    warnings: [...warnings, ...snapshot.diagnostics],
    refreshedAt: new Date().toISOString(),
    tasks,
    evidence,
    registry: { ...registry, records },
  };
}
