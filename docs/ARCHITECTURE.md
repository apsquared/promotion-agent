# Architecture decisions

## Delivery

One local TypeScript application: React UI, Node HTTP server, SQLite, and CLI entry point. Use a small UI build (proposed: Vite) with static assets served by the local process. No hosted database, Docker requirement, or separate frontend deployment. Dependency versions and SQLite driver portability must be checked during implementation. Target macOS, Linux, and Windows; avoid symlink-only installation and shell-specific scripts.

## Ownership and data model

Project files own product context, task content and completion, ledgers, and project-specific workflow overrides. Preserve the existing marketing/AGENT.md, TASKS.md, and logs layout for migration.

SQLite owns the local project registry, absolute checkout paths, agent preferences, execution records, schedule state, review metadata, assignment, and snoozing. Imported task content is a rebuildable projection, not a second authority. Backup must include non-rebuildable local data; rebuilding a task index must not erase schedules or reviews.

Stable IDs: project UUID + legacy task ID, independent of display-name changes. Run IDs and artifact revisions must be unique. Reviews bind to a specific artifact revision, destination/account, and intended action; edits invalidate stale approval.

Keep portable product settings separate from machine paths and credentials. Configuration needs a schema version and explicit migration history. Product facts should retain source references and verification dates; uncertain facts are excluded from generated claims until reviewed.

## Task import and write-back

The extracted parser is legacy-compatible and intentionally permissive. Use parseTaskSnapshot diagnostics before reconciliation, and add stronger format/round-trip validation before enabling write-back. Snapshot validation is a baseline, not a full Markdown parser.

Write-back must preserve all unrelated bytes, use a file revision/hash precondition, take a project lock, and replace files atomically. Changed-on-disk files create a conflict to resolve rather than a last-writer-wins overwrite. Only successful, validated imports may archive removed tasks. Checked tasks under Open count as done. Done and Open sections and tasks without Prompt remain supported.

Skipped/snoozed is initially local review state; it does not falsely tick a repo task as completed. Generated run context includes these dispositions so the agent does not repeatedly recommend skipped work. Decide and document a portable skip representation before expanding the file format.

## Agent boundary

Canonical run input: project ID, activity, context references, policy, budget, output directory, run ID. Canonical output: summary, artifacts, task proposals, changed files, verification evidence, errors, session reference, available usage. Unknown cost remains unknown.

Adapters: detect/version, capabilities, start, normalize events, cancel, collect result. Resume only when the installed tool supports it. Use argument arrays/stdin, never interpolate user content into a shell string. Validate agent output before displaying completion or initiating further actions.

The application should remain usable with prompt export and a later file rescan. It must not depend on controlling an existing desktop chat or assume browser tooling. Store supported-version smoke-test evidence per adapter.

Start with one active run per project and a small global concurrency limit. Never silently switch agents or models on failure. Agent CLI authentication remains owned by that tool; do not scrape or copy token files.

## Actions and permissions

Draft/review is the default. Separate research/preparation from application of code changes and external publication. For modifying runs, choose a documented isolated worktree or controlled patch approach, preserve the original checkout, and validate changed paths and project checks before applying.

Prompt instructions are not enforcement. Native agent tool permissions, restricted working directories where supported, and app-owned action gates must prevent unapproved publication. Do not launch a full-access agent with publishing secrets and assume a prompt will contain it. If an adapter cannot enforce the selected mode, downgrade to a supported handoff mode with an explanation.

Publishing connectors own credentials and external writes. Require current approval, action IDs, and read-back verification. Persist an attempt before dispatch; on an ambiguous response reconcile with the provider before retrying. If a provider cannot establish whether a write succeeded, mark uncertain and request review instead of retrying blindly.

## Local web boundary

Bind loopback by default. Enforce allowed Host/Origin values and protect mutations with a local session token/CSRF strategy. Do not expose arbitrary shell execution or unrestricted file reads. Validate registered project paths, including symlink escapes. Escape Markdown/HTML and proxy/serve only allowed artifact paths. Redact sensitive values from logs and exports. Do not expose provider credentials to browser JavaScript.

## Scheduling and shared accounts

Persist scheduled runs in SQLite. Browser closure must not stop an already-running server job; process shutdown/sleep does. Show scheduler health and missed runs. Default recovery skips stale windows or asks for a new run rather than replaying a backlog.

Use IANA timezones and daylight-saving aware date calculations. Account reservations and rate/cadence limits apply across all projects sharing an account. Distinguish generating tomorrow's drafts from actually scheduling provider posts.

## Measurement

Retain one-activity rotation plus seasonal priority. Let founders adjust channel priorities. Record published URLs, UTM values, manual outcome notes, and optional analytics references. Do not present output volume as evidence of conversion lift.
