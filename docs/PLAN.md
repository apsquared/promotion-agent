# Implementation plan

Status: source extraction complete; application implementation has not started.

## Product goal

A founder adds multiple local projects, uses Codex/Claude Code/OpenCode to perform focused marketing work, and reviews outcomes from a self-contained localhost UI. First useful result in under ten minutes for someone whose chosen agent is already installed and authenticated.

## Milestone 0 — extraction (completed)

- [x] Record source architecture and migration hazards.
- [x] Extract legacy task parsing without database dependencies.
- [x] Extract and generalize task prompts.
- [x] Supply provider-neutral workflow and project/task/log templates.
- [x] Preserve a sanitized task-board reference.
- [x] Add fictional fixtures and regression tests.
- [x] Create a plan, architecture decisions, and self-contained handoff.

This does not mean runtime integration, full reconciliation, or secure execution is implemented.

## Milestone 1 — data foundation and risk checks

### P01: Typed contracts and configuration (next)

Dependencies: milestone 0. Files: src/core/, schemas/, examples/.

Define Project, Policy, Run, Artifact, Review, TaskDisposition, Schedule, and AdapterCapabilities. Define project UUID mapping, portable vs machine-specific configuration, validation command arrays, allowed paths, timezone/cadence, and schema migration versions. Keep the legacy import contract.

Acceptance: valid/invalid config tests; relocation and display-name rename retain task identity; no credential values in portable config. Mark unknown product facts rather than filling them in.

### P02: Safe task storage and write-back

Dependencies: P01. Files: src/core/, src/storage/, tests/.

Implement SQLite migrations and backup/export for local operational data. Add read classification, strict snapshot diagnostics, format-preserving task edits, hash preconditions, atomic write, per-project locks, and safe reconciliation. Import legacy project-table rows from a user-selected file; do not ship a real portfolio list. Preview mappings before recording selected projects.

Acceptance: multiline materials and prompts survive round trips; old tasks without Prompt work; concurrent edits conflict; malformed/unreadable snapshots cannot archive tasks; skipped and completed are distinct; project deletion from the app does not delete repo files; re-import is idempotent.

### P03: Prove the three execution adapters

Dependencies: P01. Files: src/adapters/, tests/adapters/, docs/COMPATIBILITY.md.

Verify current official CLI interfaces and installed versions. Run the same tiny fictional, non-publishing fixture through all three adapters. Normalize lifecycle events and failures. Establish which permission modes can actually enforce draft-only execution. Prototype cancel/restart handling and missing-auth reporting before building a large runner UI.

Acceptance: offline contract tests for each adapter plus separately recorded live smoke evidence; missing agent/auth produces actionable diagnostics; no fabricated success; no permission-bypass flags. When credentials are unavailable, mark the live test unverified and retain prompt handoff.

## Milestone 2 — local portfolio interface

### P04: Local server and distributable shell

Dependencies: P01–P02. Files: src/server/, src/cli/, ui/, package.json.

Create the Node server, React app, local-session protection, static asset serving, health endpoint, and one-command startup. Add a fictional demo mode requiring no AI credentials. Select and lock supported dependency versions.

Acceptance: clean checkout starts via documented commands; binds loopback; hostile-origin requests and traversal attempts fail; built package includes UI assets; no cloud database needed. npm distribution stays private until P10.

### P05: Onboarding, projects, and task review

Dependencies: P04. Files: ui/, src/server/, templates/.

Add registered paths through a local folder picker or path input, import previews, context review, and per-project agent choices. Build Today, Projects, Review queue, and History. Port useful behavior from reference/legacy-task-board.tsx.txt. Generate managed agent entry points that reference one canonical workflow; never overwrite existing user instructions.

Acceptance: add two fictional projects, filter tasks, inspect materials, copy a prompt, mark one task done with verified write-back, resolve a conflict, restart with state intact. Template updates preview a diff and preserve local overrides. No manual JSON editing needed for normal onboarding.

## Milestone 3 — useful end-to-end runs

### P06: Coordinator and directory-preparation vertical slice

Dependencies: P02, P03, P05. Files: src/runner/, src/server/, ui/, tests/.

Connect run initiation, context assembly, streaming, cancellation, artifacts, review, and logging. One active modifying run per project. The first workflow prepares a directory submission kit with exact materials and a task; it submits nothing. Offer manual prompt export/rescan alongside integrated execution.

Acceptance: each supported agent produces a reviewable fictional submission kit; no mixed-project facts; cancellation retains partial artifacts; failure remains failure; output validates against the contract; Today explains why an activity was selected.

### P07: Expand workflows and content changes

Dependencies: P06. Files: templates/, src/core/, src/runner/.

Add social drafts, engagement research, blog and pSEO preparation, then project-configured content changes. Provide capability checks and explicit extension hooks for product media or database-backed content; do not bake in one application's generator. Use isolated changes, changed-path checks, and configured validation. Commits and pushes remain explicit opt-ins.

Acceptance: missing research/browser/media capabilities degrade usefully; no duplicate task/slug; unrelated dirty files remain intact; failing project validation blocks application; reviewed diff matches the applied change.

## Milestone 4 — verified external actions and recurrence

### P08: Publishing connector and exact-content review

Dependencies: P06. Files: src/connectors/, src/runner/, ui/.

Start with optional Post Bridge behind a generic connector contract; keep manual export. Bind review to text/media/account/time revision. Persist action attempts, verify results, and handle uncertain network outcomes without blind retries. Add shared-account reservations.

Acceptance: mocked timeout-after-success does not double-post; changed copy invalidates approval; wrong-project account fails; provider read-back supports scheduled/published claims; no real public posts in automated tests.

### P09: Recurring runs and basic outcome tracking

Dependencies: P06; P08 for publishing schedules. Files: src/scheduler/, ui/, src/storage/.

Persist cadence, timezone, budgets, next run, missed-run policy, and process health. Add manual outcome notes and optional analytics references. Default recurring runs create reviewable drafts; clearly distinguish run scheduling from external post scheduling.

Acceptance: daylight-saving fixtures, sleep/restart recovery, shared account limits, no backlog burst, no duplicate run dispatch. Stop/restart behavior is visible to founders.

## Milestone 5 — public release

### P10: Package, docs, external pilot, and release

Dependencies: P01–P09. Files: README.md, docs/, .github/, package.json.

Add CI on supported operating systems, locked dependencies, install/uninstall instructions, migration/backup docs, contributor templates, security reporting, and a short demo. Verify package/repository availability and copied-code rights. Keep third-party skills optional unless licensed redistribution is verified. Replace private package setting only when releasing.

Acceptance: clean-machine install; full workflow without source checkout; outside founder adds two projects and produces a useful artifact within ten minutes after agent authentication. Publish a truthful feature/agent capability matrix and limitations. Verify remote/commit/publish state independently.

## Pilot migration

Use opt-in imports of three contrasting existing products: custom media, different social cadence, and database-backed content. No source repo is required for development; fictional fixtures cover those variations. Preview import before any writes. Back up original files. Avoid duplicate schedulers: disable an old scheduler only when the replacement is verified and the owner authorizes the switch. Keep the old system available until new completion/write-back behavior is reliable.

## Deferred

Hosted SaaS, team authentication, autonomous paid advertising, auto-sending cold outreach, arbitrary plugins with unrestricted execution, agent/model auto-routing, multi-machine synchronization, and comprehensive attribution analytics.

## Definition of release success

Local-first operation; no product-context mixing; truthful run outcomes; useful manual mode; all three agent adapters verified or limitations explicitly stated; no duplicate publishing on retries; existing project customizations preserved; an external founder can onboard without maintainer help.
