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

## Release validation in progress

### P07 — reusable distribution/release (local distribution and public source complete; live gates open)

Dependencies: P04–P06. Verify clean-machine skill/command installation and native invocation in Codex, Claude Code and OpenCode, supported hosts/OS versions, license/provenance, removal/upgrade behavior and an outside founder's first useful draft. Keep npm publication and remote pushes explicit separate actions.

The packed package installs offline in an isolated temporary prefix, onboards/removes/reinstalls a fictional product, and passes 55 tests. Package contents now exclude internal planning/handoff records, MIT metadata is explicit, and reviewed removal preserves product data and customized wrappers. Public source is at `https://github.com/apsquared/promotion-agent`; the initial Ubuntu/macOS GitHub Actions check passed on Node 22.14.0. That CI run adds automated coverage, while the end-to-end install evidence remains macOS 14.5 arm64/Node 22.14.0 only. Native menu invocation in all three hosts, an outside founder's first useful draft, broader host/OS acceptance and npm publication remain open release gates. Follow the concrete sequence in docs/RELEASE.md; do not mark P07 fully complete from local helper tests or the source push.

## Deferred unless separately requested

Localhost dashboard/server, AI subprocess runners, model/auth management, background execution, autonomous scheduling, app-owned publishing connectors, hosted services, paid advertising, auto-sending outreach and unrestricted plugin execution. Existing legacy board material in reference/ remains design source only.

## Verification

Run `npm test` for code changes and record current results in docs/HANDOFF.md. Skill metadata checks and native syntax documentation do not establish native menu execution. Helpers run locally on Node 22.14+, use fictional tests, and do not need model credentials or external services.
