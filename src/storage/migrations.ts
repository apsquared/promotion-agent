import type { DatabaseSync } from 'node:sqlite';

export const DATABASE_VERSION = 1;
const initialSchema = `
CREATE TABLE projects (
  id TEXT PRIMARY KEY, checkout_path TEXT NOT NULL UNIQUE,
  project_json TEXT NOT NULL, local_json TEXT NOT NULL
) STRICT;
CREATE TABLE tasks (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, payload TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)),
  PRIMARY KEY(project_id, task_id)
) STRICT;
CREATE TABLE task_state (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL, disposition TEXT, assignee TEXT,
  PRIMARY KEY(project_id, task_id)
) STRICT;
CREATE TABLE imports (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  classification TEXT NOT NULL, hash TEXT, diagnostics TEXT NOT NULL, observed_at TEXT NOT NULL
) STRICT;
CREATE TABLE records (
  kind TEXT NOT NULL CHECK(kind IN ('run','artifact','review','schedule')),
  id TEXT NOT NULL, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, PRIMARY KEY(kind, id)
) STRICT;
CREATE TABLE migration_history (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL) STRICT;
`;

export function migrate(db: DatabaseSync) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const version = db.prepare('PRAGMA user_version').get()!.user_version as number;
    if (version > DATABASE_VERSION) throw new Error(`Database version ${version} is newer than supported ${DATABASE_VERSION}`);
    if (version === 0) {
      db.exec(initialSchema);
      db.prepare('INSERT INTO migration_history VALUES (?, ?)').run(1, new Date().toISOString());
      db.exec('PRAGMA user_version = 1');
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
