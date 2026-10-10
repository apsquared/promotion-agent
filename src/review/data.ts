import { DatabaseSync } from 'node:sqlite';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inspectProject } from '../interactive/tasks.ts';
import { taskFile } from '../storage/files.ts';
import { taskEvidenceSchema } from '../../schemas/contracts.ts';
import type { TaskDisposition } from '../core/contracts.ts';
import type { PromptTask } from '../core/task-prompt.ts';
import { DATABASE_VERSION } from '../storage/migrations.ts';

export type ReviewDraft = { reference: string; outcome: string; recordedAt: string; summary: string };
export type ReviewTask = Omit<PromptTask, 'project'> & {
  status: string;
  disposition: TaskDisposition | null;
  drafts: ReviewDraft[];
  /** Newest `verified-complete` record: the outputs, impact and next steps shown for a done task. */
  completion: ReviewDraft | null;
};

const maxRecordBytes = 256 * 1024;

/** Skipped/snoozed state for the selected project, read-only. Never migrates or reconciles. */
function readDispositions(database: string, projectId: string, root: string) {
  const db = new DatabaseSync(resolve(database), { readOnly: true });
  try {
    db.exec('PRAGMA query_only = ON; PRAGMA busy_timeout = 1000');
    if (db.prepare('PRAGMA user_version').get()!.user_version !== DATABASE_VERSION)
      throw new Error('Unsupported database version');
    const registered = db.prepare('SELECT checkout_path FROM projects WHERE id=?').get(projectId);
    if (!registered) return { status: 'unregistered', dispositions: new Map() };
    if (registered.checkout_path !== root)
      throw new Error('Database checkout differs; relocate the registration explicitly in the agent');
    const dispositions = new Map<string, TaskDisposition>();
    for (const row of db
      .prepare('SELECT task_id,disposition FROM task_state WHERE project_id=? AND disposition IS NOT NULL')
      .all(projectId))
      dispositions.set(String(row.task_id), JSON.parse(String(row.disposition)));
    return { status: 'registered', dispositions };
  } finally {
    db.close();
  }
}

/** Task-linked evidence records from the workspace's known log directory, newest first. */
function readDrafts(root: string, projectId: string, warnings: string[]) {
  const drafts: (ReviewDraft & { taskId: string })[] = [];
  let dir = root;
  try {
    for (const part of ['marketing', 'logs', 'promotion-agent']) {
      dir = join(/* turbopackIgnore: true */ dir, part);
      const stat = lstatSync(dir);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Unsafe evidence directory');
    }
    for (const name of readdirSync(/* turbopackIgnore: true */ dir).filter((n) => n.endsWith('.json'))) {
      try {
        const file = taskFile(root, `marketing/logs/promotion-agent/${name}`);
        if (lstatSync(file).size > maxRecordBytes) throw new Error('Evidence record too large');
        const record = taskEvidenceSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
        if (record.projectId !== projectId || name !== `${record.id}.json`)
          throw new Error('Evidence identity mismatch');
        const { taskId, reference, outcome, recordedAt, summary } = record;
        drafts.push({ taskId, reference, outcome, recordedAt, summary });
      } catch {
        warnings.push(`Cannot read saved record ${name}; ask the agent to inspect it.`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
      warnings.push('Saved records directory unavailable or unsafe to read.');
  }
  return drafts.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

/** Read a single selected project. Never reconcile, migrate, or discover other checkouts. */
export function reviewData(directory: string, database?: string) {
  const { root, sourceRoot, project, snapshot } = inspectProject(directory);
  const warnings: string[] = [];
  const registry = {
    status: database ? 'absent' : 'not selected',
    path: database ? resolve(database) : null,
  };
  let dispositions = new Map<string, TaskDisposition>();
  if (database && existsSync(database)) {
    try {
      ({ status: registry.status, dispositions } = readDispositions(database, project.id, root));
    } catch (error) {
      registry.status = 'unavailable';
      warnings.push(`Database: ${(error as Error).message}`);
    }
  }
  const drafts = readDrafts(root, project.id, warnings);
  const tasks: ReviewTask[] = snapshot.tasks.map((task) => {
    const records = drafts
      .filter((d) => d.taskId === task.taskId)
      .map(({ taskId: _, ...draft }) => draft);
    return {
      ...task,
      disposition: dispositions.get(task.taskId) ?? null,
      drafts: records,
      completion: records.find((r) => r.outcome === 'verified-complete') ?? null,
    };
  });
  return {
    project: {
      id: project.id,
      displayName: project.displayName,
      root,
      sourceRoot,
      tasksPath: project.tasksPath,
    },
    revision: snapshot.hash,
    classification: snapshot.classification,
    warnings: [...warnings, ...snapshot.diagnostics],
    refreshedAt: new Date().toISOString(),
    tasks,
    registry,
  };
}
