# Architecture decisions

## Execution: the current interactive session

Codex, Claude Code or OpenCode is already running under the user's control. A repo-local skill or command loads one provider-neutral workflow from `templates/WORKFLOW.md`. The active agent reads the selected project, uses available tools, prepares artifacts and reports/reviews them with the user in that conversation.

The application does not start, authenticate, choose models for, monitor, cancel or resume an AI process. The removed P03 headless adapter experiment is superseded by this architecture. Host permissions and existing user authorization govern actions. Skill text is guidance, not a security sandbox.

Provider-specific files are thin invocation wrappers. They contain no model override, tool permission grants, nested agent calls or shell interpolation. Marketing behavior lives only in the shared workflow. Capabilities are observed in the current session; missing browser/media/publishing tools yield drafts or manual handoff.

## Observer source and separate workspaces — current architecture

The product repository is an observed, read-only source. A separate private promotion workspace owns runtime, skills, configuration, context, tasks, drafts, recommendations, logs and evidence. One source checkout supports multiple product workspaces; each invocation selects one by name or existing session context. Bounded project-inventory, registration-metadata and directory-name discovery resolves the source without loading unrelated marketing data. Marketing bookkeeping is never written into the observed repo. Product changes require a separate explicit implementation request; ordinary setup/promotion requests authorize external marketing work only.

`promotion-agent.json` retains the stable project UUID and workspace-relative settings. `promotion-source.json` is a private local mapping with version 1, mode observer and the canonical source path. Display-name changes or workspace relocation do not change identity. Source and workspace must be non-overlapping canonical directories. Machine-specific mappings and real marketing records do not belong in public fixtures or commits.

## Conversational setup

`templates/WORKFLOW.md` resolves the product name using session selection, available host inventories, registration metadata and bounded local directory searches, verifying candidate identity before registration. Ambiguity is resolved through named choices; the user is never asked for a filesystem path. `templates/SETUP.md` uses that resolved source and selects a separate workspace, normally a UUID directory under ~/.local/share/promotion-agent/projects/. The agent creates the workspace, reads source documentation and handles helper commands. `onboard` takes both paths; the hash-reviewed install plan targets only the workspace. Every other CLI command takes the workspace as --project and requires observer registration. Product-local legacy plans cannot be applied through the active CLI.

The existing conservative installer is reused inside the workspace. It ships compiled helpers, shared workflow, schemas, templates, docs and thin host wrappers, preserving local customizations and marketing data. No skills, config, runtime, locks or starter marketing files are installed into the observed product. Drafting can run without installation by returning work in chat. Existing product-local installations are not migrated or removed automatically; explicit import and cleanup are separate work.

## Local helpers and state ownership

Inspect/prepare read workspace context/tasks. Evidence records and artifact references resolve within the workspace; symlinks are rejected. Complete updates the workspace task checkbox using reviewed evidence and P02 hashes/locks. Optional SQLite stores workspace registrations and dispositions; database output paths inside the observed repo, including symlink aliases, are rejected before opening it. Private preview-plan output paths have the same source boundary check.

Legacy parser/storage APIs remain compatible for existing records and tests. Their checkout fields denote the marketing workspace in observer mode, not the observed source repo. The supported CLI requires a workspace mapping; raw library callers and agent file tools are not a global security sandbox. Host permissions still govern raw agent tools, and the shared workflow explicitly prohibits unrequested product writes.

No AI CLI, authentication probe, required database, publishing connector, server or scheduler is introduced. Context comes from product documentation and existing read-only marketing history, with provenance and unknown facts retained.

## Task write-back

The permissive legacy parser is unchanged; strictTaskSnapshot gates reconciliation and completion. Missing/unreadable/invalid imports cannot archive tasks. Skipped/snoozed is independent of repo completion. Only successful validated snapshots reconcile absent tasks.

Completion changes one checkbox while preserving multiline content and all unrelated bytes. It requires the reviewed hash, takes a cooperative per-project lock, stages and atomically replaces the file, and verifies read-back. Conflicts require rescan/review. Never overwrite a stale snapshot. Symlink task paths are rejected. Registry deletion never removes workspace files. See docs/STORAGE.md for recovery and the residual external-editor race.

## Actions and evidence

Default to draft/review. Respect prior user authorization; when an external action is not authorized, show exact content/destination before executing. Changes invalidate stale approval. Use only available integrations in the current interactive host; never copy credentials into project files or model prompts.

Log actual artifacts, checks, verified URLs/provider confirmations and unresolved limitations. Distinguish drafted, submitted, scheduled, published and uncertain. Do not infer a result from intent or a generated summary. No implicit commit, push, spending or outreach. Product-specific extensions remain owned by their project; do not bake another product's generator or database into this repo.

## Optional Next.js review desk

`app/` supplies a local inbox and server-only read route. The launcher selects one project and optional registry, binds Next.js to loopback, and creates a session token. `src/review/data.ts` reads SQLite in read-only/query-only mode without using the mutating Store constructor. It combines current source tasks with task-linked evidence previews and separately exposes saved registry projections/history. Missing or invalid imports never authorize reconciliation or deletion. Only the selected project ID is read; other checkout paths are not followed.

The UI renders materials as inert text and only previews contained regular files referenced by evidence/artifact records. The only handoff is a copyable prompt with exact task context, revision hashes and review notes. Browser requests cannot select filesystem paths or mutate state. The agent performs actions under the existing workflow and verifies outcomes. Refresh rereads saved data; copying is neither approval nor completion.

The Next.js build and `vercel.json` support the chosen deployment technology. The current local adapter is not a hosted persistence layer: remote deployment needs explicit data delivery/storage and hosted authentication. No remote publishing, database migration or hosted integration is implied. See `docs/REVIEW-UI.md`.

## Competitor research activity

`templates/activities/competitor-analysis.md` defines competitor comparison and verified public mention discovery under activity `competitor`. The shared workflow routes conversational requests to it. The `promotion-competitors` Codex skill and `/promote-competitors` commands are thin entrypoints; the installer carries the same procedure and relative references into a selected promotion workspace, preserving customized files. No provider-specific research code or background monitor is added.

The existing string-valued task categories and records support this activity without schema changes. Task-linked Markdown research reports use the evidence helper and the review desk's existing previews/copyable prompts. The task prompt builder supplies a research-specific fallback for tasks without custom steps. Finding a mention is not an engagement action or confirmed buying intent; report completion and recommended follow-up actions remain separate.
