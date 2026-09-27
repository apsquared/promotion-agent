import { DatabaseSync } from 'node:sqlite';
import { closeSync, mkdirSync, openSync, writeFileSync, unlinkSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { bindProject } from '../core/contracts.ts';
import { artifactSchema, reviewSchema, runSchema, scheduleSchema, taskDispositionSchema, taskKeySchema, uuid } from '../../schemas/contracts.ts';
import { canonicalCheckout, readTaskFile, withProjectLock, writeCompletedTask } from './files.ts';
import { DATABASE_VERSION, migrate } from './migrations.ts';

const recordSchemas = { run: runSchema, artifact: artifactSchema, review: reviewSchema, schedule: scheduleSchema };
type RecordKind = keyof typeof recordSchemas;
const tables = ['projects', 'tasks', 'task_state', 'imports', 'records', 'migration_history'] as const;

/** Local operational state only. Repository task bytes remain authoritative. */
export class Store {
  #db: DatabaseSync;
  readonly lockRoot: string;
  constructor(filename: string) {
    const path = resolve(filename);
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    try { closeSync(openSync(path, 'wx', 0o600)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    this.lockRoot = `${realpathSync(path)}.locks`;
    this.#db = new DatabaseSync(path);
    try {
      this.#db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 1000;');
      migrate(this.#db);
    } catch (error) { this.#db.close(); throw error; }
  }
  close() { this.#db.close(); }
  #transaction<T>(action: () => T): T {
    this.#db.exec('BEGIN IMMEDIATE');
    try { const result = action(); this.#db.exec('COMMIT'); return result; }
    catch (error) { this.#db.exec('ROLLBACK'); throw error; }
  }
  getProject(projectId: string) {
    uuid.parse(projectId);
    const row = this.#db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!row) throw new Error('Project not registered');
    return bindProject(JSON.parse(row.project_json as string), JSON.parse(row.local_json as string));
  }
  listProjects() {
    return this.#db.prepare('SELECT id FROM projects ORDER BY id').all().map(r => this.getProject(r.id as string));
  }
  /** Relocation is explicit; importing a table cannot silently move an existing UUID. */
  registerProject(project: unknown, local: unknown, options: { allowRelocation?: boolean } = {}) {
    const mapped = bindProject(project, local);
    mapped.local.checkoutPath = canonicalCheckout(mapped.local.checkoutPath);
    return withProjectLock(this.lockRoot, mapped.project.id, () => this.#transaction(() => {
      this.#register(mapped, options.allowRelocation === true);
      return mapped;
    }));
  }
  #register(mapped: ReturnType<typeof bindProject>, allowRelocation: boolean) {
    const existing = this.#db.prepare('SELECT checkout_path FROM projects WHERE id = ?').get(mapped.project.id);
    if (existing && existing.checkout_path !== mapped.local.checkoutPath && !allowRelocation) throw new Error('Project relocation requires explicit allowRelocation');
    this.#db.prepare(`INSERT INTO projects VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      checkout_path=excluded.checkout_path, project_json=excluded.project_json, local_json=excluded.local_json`)
      .run(mapped.project.id, mapped.local.checkoutPath, JSON.stringify(mapped.project), JSON.stringify(mapped.local));
  }
  /** Import only new mappings, atomically. Existing registrations/preferences remain intact. */
  registerSelected(mappings: { project: unknown; local: unknown }[]) {
    const parsed = mappings.map(m => {
      const mapped = bindProject(m.project, m.local);
      mapped.local.checkoutPath = canonicalCheckout(mapped.local.checkoutPath);
      return mapped;
    });
    return this.#transaction(() => parsed.map(mapped => {
      const existing = this.#db.prepare('SELECT id FROM projects WHERE checkout_path = ?').get(mapped.local.checkoutPath);
      if (existing) {
        if (existing.id !== mapped.project.id) throw new Error('Preview mapping changed; preview again');
        return this.getProject(existing.id as string);
      }
      // Import may not relocate or rename an existing UUID.
      if (this.#db.prepare('SELECT id FROM projects WHERE id = ?').get(mapped.project.id)) throw new Error('Project UUID already registered');
      this.#register(mapped, false);
      return mapped;
    }));
  }
  removeProject(projectId: string) {
    return withProjectLock(this.lockRoot, projectId, () => this.#transaction(() => {
      this.#db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    }));
  }
  listTasks(projectId: string) {
    this.getProject(projectId);
    return this.#db.prepare(`SELECT t.*, s.disposition, s.assignee FROM tasks t LEFT JOIN task_state s
      ON t.project_id=s.project_id AND t.task_id=s.task_id WHERE t.project_id=? ORDER BY t.task_id`).all(projectId).map(r => ({
      ...JSON.parse(r.payload as string), projectId, archived: r.archived === 1,
      disposition: r.disposition ? JSON.parse(r.disposition as string) : null, assignee: r.assignee ?? null,
    }));
  }
  lastImport(projectId: string) {
    this.getProject(projectId);
    const row = this.#db.prepare('SELECT * FROM imports WHERE project_id=?').get(projectId);
    return row ? { ...row, diagnostics: JSON.parse(row.diagnostics as string) } : null;
  }
  #reconcile(projectId: string, snapshot: ReturnType<typeof readTaskFile>) {
    return this.#transaction(() => {
      this.#db.prepare(`INSERT INTO imports VALUES (?,?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET
        classification=excluded.classification, hash=excluded.hash, diagnostics=excluded.diagnostics, observed_at=excluded.observed_at`)
        .run(projectId, snapshot.classification, snapshot.hash, JSON.stringify(snapshot.diagnostics), new Date().toISOString());
      if (snapshot.classification !== 'valid') return { ...snapshot, reconciled: false };
      this.#db.prepare('UPDATE tasks SET archived=1 WHERE project_id=?').run(projectId);
      const upsert = this.#db.prepare(`INSERT INTO tasks VALUES (?,?,?,0) ON CONFLICT(project_id,task_id) DO UPDATE SET payload=excluded.payload, archived=0`);
      for (const task of snapshot.tasks) upsert.run(projectId, task.taskId, JSON.stringify(task));
      return { ...snapshot, reconciled: true };
    });
  }
  scanProject(projectId: string) {
    return withProjectLock(this.lockRoot, projectId, () => {
      const { project, local } = this.getProject(projectId);
      return this.#reconcile(projectId, readTaskFile(local.checkoutPath, project.tasksPath));
    });
  }
  completeTask(projectId: string, taskId: string, expectedHash: string) {
    taskKeySchema.parse({ projectId, taskId });
    return withProjectLock(this.lockRoot, projectId, () => {
      const { project, local } = this.getProject(projectId);
      const snapshot = writeCompletedTask(local.checkoutPath, project.tasksPath, taskId, expectedHash);
      // A crash here leaves source correct; a later scan rebuilds the projection.
      return this.#reconcile(projectId, snapshot);
    });
  }
  setDisposition(value: unknown) {
    const disposition = taskDispositionSchema.parse(value);
    const { projectId, taskId } = disposition.task;
    return withProjectLock(this.lockRoot, projectId, () => {
      this.#requireTask(projectId, taskId);
      this.#db.prepare(`INSERT INTO task_state(project_id,task_id,disposition) VALUES (?,?,?)
        ON CONFLICT(project_id,task_id) DO UPDATE SET disposition=excluded.disposition`).run(projectId, taskId, JSON.stringify(disposition));
    });
  }
  setAssignee(projectId: string, taskId: string, assignee: string | null) {
    taskKeySchema.parse({ projectId, taskId });
    if (assignee !== null && (typeof assignee !== 'string' || !assignee.trim())) throw new Error('Assignee must be nonempty or null');
    return withProjectLock(this.lockRoot, projectId, () => {
      this.#requireTask(projectId, taskId);
      this.#db.prepare(`INSERT INTO task_state(project_id,task_id,assignee) VALUES (?,?,?)
        ON CONFLICT(project_id,task_id) DO UPDATE SET assignee=excluded.assignee`).run(projectId, taskId, assignee);
    });
  }
  #requireTask(projectId: string, taskId: string) {
    if (!this.#db.prepare('SELECT 1 FROM tasks WHERE project_id=? AND task_id=?').get(projectId, taskId)) throw new Error('Task not imported');
  }
  /** Persist typed operational records independently of the rebuildable task projection. */
  saveRecord(kind: RecordKind, value: unknown) {
    if (!Object.hasOwn(recordSchemas, kind)) throw new Error('Unknown record kind');
    const parsed = recordSchemas[kind].parse(value);
    const projectId = 'input' in parsed ? parsed.input.projectId : 'binding' in parsed ? parsed.binding.projectId : parsed.projectId;
    const id = 'input' in parsed ? parsed.input.id : kind === 'artifact' ? (parsed as { revision: string }).revision : (parsed as { id: string }).id;
    return withProjectLock(this.lockRoot, projectId, () => this.#transaction(() => {
      this.getProject(projectId);
      const existing = this.#db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind, id);
      if (existing && existing.project_id !== projectId) throw new Error('Record ID belongs to another project');
      const payload = JSON.stringify(parsed);
      if (existing && kind === 'artifact' && existing.payload !== payload) throw new Error('Artifact revisions are immutable');
      this.#db.prepare(`INSERT INTO records VALUES (?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload`).run(kind, id, projectId, payload);
      return parsed;
    }));
  }
  listRecords(projectId: string) {
    this.getProject(projectId);
    return this.#db.prepare('SELECT kind,payload FROM records WHERE project_id=? ORDER BY kind,id').all(projectId)
      .map(r => ({ kind: r.kind, value: JSON.parse(r.payload as string) }));
  }
  /** Consistent local export, including non-rebuildable state. Contains machine paths; keep private. */
  exportData() {
    return this.#transaction(() => ({ databaseVersion: DATABASE_VERSION, tables: Object.fromEntries(tables.map(table =>
      [table, this.#db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()])) }));
  }
  exportTo(filename: string) {
    writeFileSync(filename, JSON.stringify(this.exportData(), null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  }
  /** SQLite's VACUUM INTO captures a consistent full database, not a partial live-file copy. */
  backupTo(filename: string) {
    const destination = resolve(filename);
    closeSync(openSync(destination, 'wx', 0o600));
    try { this.#db.prepare('VACUUM INTO ?').run(destination); }
    catch (error) { unlinkSync(destination); throw error; }
  }
}
