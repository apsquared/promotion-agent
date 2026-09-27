# Architecture decisions

## Execution: the current interactive session

Codex, Claude Code or OpenCode is already running under the user's control. A repo-local skill or command loads one provider-neutral workflow from `templates/WORKFLOW.md`. The active agent reads the selected project, uses available tools, prepares artifacts and reports/reviews them with the user in that conversation.

The application does not start, authenticate, choose models for, monitor, cancel or resume an AI process. The removed P03 headless adapter experiment is superseded by this architecture. Host permissions and existing user authorization govern actions. Skill text is guidance, not a security sandbox.

Provider-specific files are thin invocation wrappers. They contain no model override, tool permission grants, nested agent calls or shell interpolation. Marketing behavior lives only in the shared workflow. Capabilities are observed in the current session; missing browser/media/publishing tools yield drafts or manual handoff.

## Local commands

`src/interactive/tasks.ts` and `scripts/promotion.mjs` provide deterministic inspect, prepare and explicit completion commands. They never spawn an AI CLI. Inspect/prepare are read-only and use one explicitly selected project; no portfolio scan or model account is needed. Completion reuses P02 storage locks and content-hash preconditions. It does not itself prove an external task was completed.

P06 adds immutable, task-linked evidence accounts under `marketing/logs/promotion-agent/`. Draft records need no database; local artifact references are content-hashed and completion requires the exact reviewed `verified-complete` record hash bound to the task revision. The interactive agent still verifies the underlying action; a URL or claim in a record is not self-proving. Skipped/snoozed/active dispositions use the optional SQLite registry and do not alter source task completion. Existing product ledgers remain project-owned.

P04 onboarding creates a reviewable plan for one canonical project path, then applies it only with the plan's review hash and unchanged before-images. A manifest records hashes of installer-owned files. Upgrades replace only unmodified managed files; product context, tasks, logs, config and customized wrappers remain owned by the product. Installed `.promotion-agent/` contains compiled JavaScript, the shared workflow, schemas, templates and guidance, with relative links from the host wrappers. The source checkout has a pinned TypeScript build/typecheck; installed products only need Node 22.14+ for local helpers.

There is no required server, React app, app-owned publishing connector, or scheduler. These are deferred optional products, not prerequisites for the useful interactive workflow. Do not reintroduce them without a new user request.

## State ownership

Project files own product context, task content and completion, ledgers and project-specific instructions. Preserve the marketing/AGENT.md, TASKS.md and logs layout. Portable settings retain the project UUID across rename/relocation. Unknown facts remain unknown.

The P01/P02 contracts and SQLite library remain available for optional local registry/history/review/disposition state and safe completion. Task projections are rebuildable; local metadata is not. The interactive workflow can prepare drafts without registration or a database. Old Run/Schedule/AdapterCapabilities types remain compatible for stored data; they do not activate execution or scheduling and are not discovery prerequisites.

## Task write-back

The permissive legacy parser is unchanged; strictTaskSnapshot gates reconciliation and completion. Missing/unreadable/invalid imports cannot archive tasks. Skipped/snoozed is independent of repo completion. Only successful validated snapshots reconcile absent tasks.

Completion changes one checkbox while preserving multiline content and all unrelated bytes. It requires the reviewed hash, takes a cooperative per-project lock, stages and atomically replaces the file, and verifies read-back. Conflicts require rescan/review. Never overwrite a stale snapshot. Symlink task paths are rejected. Registry deletion never removes repo files. See docs/STORAGE.md for recovery and the residual external-editor race.

## Actions and evidence

Default to draft/review. Respect prior user authorization; when an external action is not authorized, show exact content/destination before executing. Changes invalidate stale approval. Use only available integrations in the current interactive host; never copy credentials into project files or model prompts.

Log actual artifacts, checks, verified URLs/provider confirmations and unresolved limitations. Distinguish drafted, submitted, scheduled, published and uncertain. Do not infer a result from intent or a generated summary. No implicit commit, push, spending or outreach. Product-specific extensions remain owned by their project; do not bake another product's generator or database into this repo.
