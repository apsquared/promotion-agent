# Implementation plan

## Product goal and revised direction

The user opens promotion-agent in an existing interactive Codex, Claude Code or OpenCode session and invokes a skill/command for one explicitly selected product. That agent performs the work and reviews it with the user. No nested AI CLI, authentication probing, mandatory web app or scheduler.

The headless P03 experiment has been removed at the user's request. Existing P01/P02 work is retained as optional deterministic infrastructure. Work through the revised plan below in order.

## Completed foundation

### P00 — extraction (completed)

Legacy-compatible task parser/prompts, fictional product fixture, shared workflow, project/log templates, provenance and regression tests. No real portfolio imported.

### P01 — typed contracts/configuration (completed)

Strict portable/local configuration schemas, stable UUID/task identity, fact provenance, default draft policy and structured record types. Runtime validation and the pinned TypeScript typecheck are verified. Retain existing stored-data compatibility, including unused historical capability/schedule types.

### P02 — safe local storage/write-back (completed)

Transactional SQLite schema and backup/export, strict task read classification, safe reconciliation, byte-preserving checkbox completion, hash checks and cooperative locks, explicit selected-file portfolio import previews. See docs/STORAGE.md for evidence and limits. This library is optional for drafting.

### P03 — interactive skills and commands (completed)

- Repo-local Codex `promotion-agent` skill; Claude Code/OpenCode `/promote` wrappers.
- One canonical workflow in templates/WORKFLOW.md, executed by the current agent.
- Read-only inspect/prepare helpers and explicit hash-checked completion using P02.
- Removed AI subprocess adapters, CLI probes, synthetic model runner fixtures and live CLI smoke command.
- Reframed architecture/docs around native session tools and conversation review.

Acceptance: helper tests preserve valid task context/legacy behavior, reject malformed/completed/unknown tasks, preserve files during preparation, conflict on stale completion, and do not depend on installed AI CLIs. Validate skill metadata/reference paths. Native host menu invocation remains separately unverified; do not recreate a CLI runner to test it.

### P04 — portable onboarding and packaging (completed)

Dependencies: P01–P03. Let a user explicitly add a selected project/config and install the shared workflow/entry points with previews, no overwrite of custom instructions, and no writes to unrelated repos. Add and lock a minimal TypeScript typecheck/build pipeline. Keep a direct read-the-workflow fallback. Test relocation and upgrades using fictional directories. Do not build a server/UI.

Implemented a review-hash-gated plan/apply installer for one selected project, with a self-contained compiled runtime, shared workflow, Codex/Claude/OpenCode entry points, conservative ownership manifest, and product-owned starter files created only when absent. Locally customized or unmanaged content is preserved. The pinned TypeScript build/typecheck and fictional relocation/upgrade tests pass. Native host discovery and an outside founder's experience remain P05/P07 verification work.

### P05 — interactive workflow coverage (Codex exercise completed)

Dependencies: P04. Exercise directory kits, social drafts, engagement research and content proposals in real interactive hosts using fictional inputs. Check host discovery, useful fallback for missing tools, project-context separation, duplicate prevention and exact-content review. Record observed artifacts and distinguish real interactive evidence from automated helper tests.

The current Codex desktop session produced and reviewed fictional artifacts for all four activities, exercised a missing-directory fallback, used real public-thread research without posting, avoided logged duplicates, and kept two product contexts separate. See docs/P05-VERIFICATION.md. The skill was visible in this session's catalog, but native menu selection was not tested. Claude Code and OpenCode were unavailable as active sessions; their native command invocation remains P07 release verification. Do not describe those hosts as live-verified from file-layout tests.

### P06 — completion, logs and optional local history (completed)

Dependencies: P02, P05. Make verified completion/evidence logging and skipped/snoozed state convenient to the interactive agent without requiring a database for drafts. Preserve file formatting, source ownership and conflict behavior. Add artifact/review helpers only where they improve a concrete workflow.

Implemented task-linked, no-overwrite evidence records in the selected project's marketing logs. Draft records need no database; local artifact references are hashed. The interactive `complete` command requires a matching reviewed `verified-complete` record hash and rejects skipped/snoozed tasks until reactivated, while P02 still owns the byte-preserving checkbox write. Optional `state`/`disposition` commands expose skipped/snoozed/active status in one chosen local registry without changing source task files. The helper validates evidence structure and revision, not the truth of a provider action. Existing project ledgers remain project-owned; no generic artifact approval or publishing helper was added.

### Conversational onboarding refinement (implemented; live acceptance pending)

Setup, drafting, revisions, and status now share conversational routes in `templates/WORKFLOW.md`. `templates/SETUP.md` directs the active agent to handle builds, preview/review/apply, and returned hashes using the existing guarded installer. Source instructions and installed wrappers route to that contract. README and the BarGPT smoke test use natural-language prompts; a draft alone needs no installation. No runner, dependencies, database requirement, or installer bypass was added.

Validation: `npm run check` passed 55/55 tests, including installed resource/link checks after relocation and removal of the original bundle. The package dry run includes the new setup procedure and smoke guide. This verifies packaging/helpers; real conversational setup and native menu invocation remain acceptance work.

## Release validation in progress

### P07 — reusable distribution/release (local distribution and public source complete; live gates open)

Dependencies: P04–P06. Verify clean-machine skill/command installation and native invocation in Codex, Claude Code and OpenCode, supported hosts/OS versions, license/provenance, removal/upgrade behavior and an outside founder's first useful draft. Keep npm publication and remote pushes explicit separate actions.

The packed package installs offline in an isolated temporary prefix, onboards/removes/reinstalls a fictional product, and passes 55 tests. Package contents now exclude internal planning/handoff records, MIT metadata is explicit, and reviewed removal preserves product data and customized wrappers. Public source is at `https://github.com/apsquared/promotion-agent`; the initial Ubuntu/macOS GitHub Actions check passed on Node 22.14.0. That CI run adds automated coverage, while the end-to-end install evidence remains macOS 14.5 arm64/Node 22.14.0 only. Native menu invocation in all three hosts, an outside founder's first useful draft, broader host/OS acceptance and npm publication remain open release gates. Follow the concrete sequence in docs/RELEASE.md; do not mark P07 fully complete from local helper tests or the source push.

## P08 — optional local Next.js review desk (completed locally)

User-requested addition on 2026-09-28, after the P01–P06 foundations. P07's external host/release gates remain open independently. Conversation stays primary; a compact inbox shows current project tasks, saved draft/evidence previews and selected SQLite registry state/history. Copyable prepare/revise/action/verify prompts are the primary action. No AI runner, database-only completion, browser mutation API or automatic publishing.

The app uses Next.js App Router/React, an authenticated server read route, and a loopback launcher. Review consumes files and SQLite without reconciling or changing them. Vercel build configuration is included; hosted data delivery and authentication remain separate future work. Validation: `npm run check` passed both typechecks and 61/61 tests; `npm run review:build` passed. A production server was exercised in the browser with a temporary fictional product/registry: draft preview, real clipboard contents, review notes, status/search filters, database history, completed-task verification, anchor navigation/refresh and desktop/mobile layout. No real product, provider or hosted deployment was exercised.

## P09 — competitor research activity (completed; live research acceptance not exercised)

User-requested marketing activity on 2026-09-29, using the P03 shared workflow, P04 portable installation, P06 evidence helpers and P08 review handoff. Add a sourced competitor comparison and verified mention discovery, with channel/source context, duplicate handling and ranked opportunities. Dedicated Codex skill and Claude Code/OpenCode commands must point to one canonical research procedure. Reports and optional reply drafts do not authorize posting or recurring monitoring.

Acceptance: source/installed entrypoints resolve after relocation, upgrades preserve customizations and removal respects ownership; a `competitor` task can prepare, record a draft report, and surface its contents and evidence in the review handoff while remaining open. Validation: Skill Creator reports `Skill is valid!`; `npm run check` passed both typechecks, the helper build and 63/63 tests, including portable entrypoint ownership/link coverage and a task-to-report-to-review handoff. Package dry-run includes the activity resource. Live search quality and native host invocation remain separate from these deterministic checks.

## Deferred unless separately requested

AI subprocess runners, model/auth management, background execution, autonomous scheduling, app-owned publishing connectors, hosted services, paid advertising, auto-sending outreach and unrestricted plugin execution. Existing legacy board material in reference/ remains design source only.

## Verification

Run `npm test` for code changes and record current results in docs/HANDOFF.md. Skill metadata checks and native syntax documentation do not establish native menu execution. Helpers run locally on Node 22.14+, use fictional tests, and do not need model credentials or external services.
