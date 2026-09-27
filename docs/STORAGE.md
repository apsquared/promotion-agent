# Local storage and task write-back (P02)

The optional storage API is implemented and tested. The interactive completion helper now uses it; inspect/prepare and ordinary skill-driven drafting do not require a database. There is no AI CLI runner or required server/UI. It uses Node 22.14's built-in `node:sqlite` (`DatabaseSync`), keeping development self-contained with no npm dependencies. SQLite is experimental in this Node version; supported OS/build compatibility remains a P04/P07 release check. API reference: [Node 22.14 SQLite documentation](https://nodejs.org/download/release/v22.14.0/docs/api/sqlite.html).

## State and migrations

`src/storage/store.ts` exposes `Store(filename)`. The caller chooses a machine-local database location outside product source. Newly created directories/files use owner-only permissions where the OS supports them. The store enables foreign keys and a bounded busy timeout. `migrations.ts` applies the initial schema inside a transaction, records migration history, and rejects newer database versions. A failed initial migration rolls back schema and version changes. Back up before applying future schema upgrades.

Tables hold:

- Canonical project UUID/path mappings and validated portable/local configuration snapshots.
- Rebuildable imported task content, with an archived flag for tasks absent from a successful snapshot.
- Independent skipped/snoozed dispositions and assignments, retained across scans and task disappearance/reappearance.
- Latest scan classification, diagnostics, content hash and observation time.
- Validated run, artifact revision, review and schedule records. Artifact revisions are immutable; record IDs cannot move between projects.

`registerProject` rejects duplicate canonical checkout paths. Rename keeps the UUID; relocation requires the existing UUID plus `{ allowRelocation: true }`. That flag is only for a caller that has explicitly selected the replacement checkout. Registry removal deletes local rows through foreign-key cascades and never touches repository files. Repository configuration remains authoritative; these stored settings are snapshots supplied at registration, not a config-file watcher.

## Scanning and reconciliation

`scanProject(projectId)` reads only that registered checkout's configured task path. Read classifications are `valid`, `invalid` (including ambiguous/partial structures), `missing`, and `unreadable` (including invalid UTF-8, non-files and unsafe paths). Only a valid scan can update or archive task projections. Invalid reads only update diagnostic metadata. Task reconciliation and import metadata commit together or roll back together. A successful repeat scan is idempotent for task and local review state.

`strictTaskSnapshot` wraps the unchanged permissive legacy parser. It accepts the included task fixture and empty template, Open/Done completion semantics, and tasks without Prompt. It rejects duplicate or unexpected sections, malformed headers, impossible calendar dates, missing Materials, duplicate fields, unsupported unindented continuation text, control characters, and fenced blocks inside task sections. Preamble fenced examples are excluded from parsing. Unsupported Markdown requires manual correction; it is never treated as an empty authoritative import. A syntactically valid empty task file with `## Open` is intentionally a valid empty snapshot. No parser can distinguish an intentional valid removal from a file truncated at a valid structural boundary.

## Write-back and concurrency

`completeTask(projectId, taskId, expectedHash)` requires the SHA-256 returned by a current scan. It changes only the checkbox character, preserving all other source bytes, including multiline Materials/Prompt, CRLF, BOM, and absent final newline. It does not move tasks between sections, rewrite materials, or append completion evidence. Broader editing remains future work; the active interactive agent collects completion evidence; do not infer verified external completion from a checkbox.

P06's interactive `complete` helper now requires a separately recorded `verified-complete` evidence file and its exact hash before calling this P02 method. Evidence files live under the selected product's `marketing/logs/promotion-agent/` path. Draft evidence needs no SQLite; local artifact references are hashed. The record reflects what the interactive agent says it verified and is not independent proof of a provider action. The source checkbox and existing product ledgers remain separate authorities. Optional skipped/snoozed dispositions use this SQLite registry and do not check source tasks off.

Each project operation uses an atomic lock directory next to the canonical database file. Locks exclude other app processes sharing that registry. A second operation fails with an actionable lock error instead of waiting indefinitely. Owner PID/time is recorded. Exceptions release the lock; a killed process may leave it behind. For recovery, stop app writers, verify the owner is no longer active, then remove only that project's lock directory. Never automatically steal a lock based on age or PID alone. Separate database installations do not share these locks.

Write-back rejects stale hashes, creates a unique temporary file alongside TASKS.md, preserves file permissions, flushes file data, rechecks hash and file identity, then atomically renames and verifies read-back. Failures before rename leave the source unchanged and remove the temp file. A process killed before cleanup can leave a temp file; remove it only after confirming no writer is active. Symlink task files/directories are rejected, even when they point inside the checkout. Checkout roots are canonicalized at registration and checked again on use.

The check-and-rename sequence is not an OS-level compare-and-swap against unrelated editors. An external edit or directory swap in the final check/rename window remains possible; these controls are for cooperative local use, not a sandbox against a hostile process. Avoid simultaneous manual edits during write-back. A detected conflict requires rescan/review, never blind retry. The file is authoritative if a crash occurs after rename but before database reconciliation; scan again to recover the projection. This does not promise directory-entry durability across sudden power loss.

## Explicit legacy portfolio import

`LegacyProjectImporter(store).preview(selectedFilename)` reads a user-selected Markdown table without writing registry or repo files. Supported name columns: Project, Product, Name. Supported path columns include Source Dir, Source Directory, Repo, Repository, Repo Path, Local Path, Source, SourceDir, and Path (case-insensitive). One name column and one path column are required in exactly one table. Optional columns are ignored; account/credential values are not imported. Pipes within cells are unsupported and must be corrected manually.

Paths may be absolute, relative to the selected table's directory, or start with `~/`; backtick-wrapped paths are accepted. Checkouts must exist. Duplicate canonical paths and invalid rows produce diagnostics and block applying the entire preview. No scanning or import of a real portfolio occurs automatically.

Preview results expose row numbers, display names, canonical paths and proposed UUIDs. `apply(token, selectedRowNumbers)` records only explicitly selected mappings in one transaction after verifying source hash and mappings again. Existing paths retain UUIDs and settings. A consumed token cannot be reused; a changed source or competing mapping requires another preview. Re-preview/re-import is idempotent. Import never archives tasks or unregisters projects absent from the table.

## Backup, export, and recovery

`backupTo(newFilename)` uses SQLite `VACUUM INTO` to capture a consistent full database, including operational records and local task state. `exportTo(newFilename)` writes a consistent JSON inspection/export snapshot of all tables. Both refuse to overwrite existing files and create owner-only files. These are private local backups containing machine paths and possibly product/task text; they are not portable project configuration or sanitized sharing artifacts. No resolved credential values are fetched or stored by these APIs.

To restore, close all Store instances/writers, retain the current database as a separate backup, and open the backup copy using `new Store(backupFilename)` (or copy it to a new chosen registry filename). Do not overwrite an open SQLite database. Re-register relocated checkout paths explicitly, then rescan source files. Backup reopening and complete table equality are covered by tests. JSON restore and repo-file backups are not provided by this API: back up product files separately because the SQLite task projection is not their authority. Keep existing local lock directories separate when moving/restoring a database.

## Verified scope

The original P02 run on Node v22.14.0 / SQLite 3.47.2 on macOS passed 38 tests: 21 storage/write-back/import tests plus the 17 prior contract and legacy tests. Tests use fictional temporary repositories and include transaction rollback, restart/idempotence, backup restoration, preserved multiline/CRLF/BOM content, stale revisions, cross-process locks, external edits during staging, failed rename cleanup, invalid-read non-archival, symlink rejection, and selective import preview/conflicts. Current cumulative results, including the P04 typecheck and P06 interactive helpers, are in docs/HANDOFF.md. No real portfolio, scheduling dispatch or publishing was exercised.
