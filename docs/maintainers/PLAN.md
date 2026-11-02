# Implementation plan

## Product goal and revised direction

The user opens a private promotion workspace in an existing interactive Codex, Claude Code or OpenCode session and invokes a skill/command for one explicitly selected product. The source checkout is the development repository and currently also supplies initial setup, upgrades and checkout-only features. That agent performs the work and reviews it with the user. No nested AI CLI, authentication probing, mandatory web app or scheduler.

The headless P03 experiment has been removed at the user's request. Existing P01/P02 work is retained as optional deterministic infrastructure. Work through future milestones in dependency order. P10 supersedes the historical product-local ownership/installation descriptions in P04–P09 below.

## P10 — observer repositories and external workspaces (implemented locally)

Current direction, 2026-10-09: product repositories are read-only sources; all promotion-agent bookkeeping, runtime, skills, configuration, tasks, drafts, proposals, logs and evidence belong to separate private workspaces. One source checkout supports multiple explicitly selected product workspaces. Recommendations do not authorize product code/content changes.

Implemented after P09: observer registration with stable existing project UUID and a private canonical source mapping; workspace-targeted onboarding/install; CLI rejection of unregistered/product-local destinations; overlap and symlink-aware plan/database output checks; workspace task/evidence completion; review source/workspace fields and prompt boundary; shared workflow and all three host entrypoints; revised README/setup/architecture/manual smoke test. Existing product-local installations remain unchanged; migration/cleanup is separately requested work. Legacy library contracts remain compatible and are not a global sandbox.

Acceptance: automated lifecycle verifies source bytes and file layout remain unchanged, source/workspace overlap and symlink escapes fail before writes, evidence and completion target only workspace files, two products remain separate, and relocation preserves identity. Native host menu/conversational acceptance and live browser acceptance of the revised path display remain separate from automated checks. No real product installation or migration, commit, push or publication is part of this milestone. See HANDOFF for final validation evidence.

## P11 — project registration by name (implemented locally)

Depends on P10. The shared workflow v0.6 resolves a named product through session context, host inventories when available, existing registration metadata and bounded local directory discovery. Verify candidate identity and canonical paths before registering; reuse matching workspaces and stable UUIDs. Never ask for a filesystem path. Clarify ambiguous matches with named choices; unavailable checkouts require opening/selecting the product or making it accessible. Product data reads remain limited to the resolved selection.

Source skills/commands, generated installed entrypoints, setup, README, architecture and smoke guidance are aligned across Codex, Claude Code and OpenCode. CLI paths remain internal resolved arguments; installer write/review gates are unchanged. Validation: `npm run check` passed both typechecks, build and 67/67 tests. A fictional built installation preview includes the discovery procedure, linked setup and all six aligned entrypoints. Live name discovery and native host conversation remain manual acceptance work; see HANDOFF.

P11 follow-up: WORKFLOW v0.7 checks bounded candidate identity metadata even without a directory-name match and setup retains the product display name separately from repository/package names. `npm run check` passed 68/68 tests and both typechecks. The new CLI regression verifies differing names through registration, review and upgrade with stable identity and unchanged source bytes; live metadata discovery remains unverified.

## Completed foundation

### P00 — extraction (completed)

Legacy-compatible task parser/prompts, fictional product fixture, shared workflow, project/log templates, provenance and regression tests. No real portfolio imported.

### P01 — typed contracts/configuration (completed)

Strict portable/local configuration schemas, stable UUID/task identity, fact provenance, default draft policy and structured record types. Runtime validation and the pinned TypeScript typecheck are verified. Retain existing stored-data compatibility, including unused historical capability/schedule types.

### P02 — safe local storage/write-back (completed)

Transactional SQLite schema and backup/export, strict task read classification, safe reconciliation, byte-preserving checkbox completion, hash checks and cooperative locks, explicit selected-file portfolio import previews. See docs/maintainers/STORAGE.md for evidence and limits. This library is optional for drafting.

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

The current Codex desktop session produced and reviewed fictional artifacts for all four activities, exercised a missing-directory fallback, used real public-thread research without posting, avoided logged duplicates, and kept two product contexts separate. See docs/maintainers/history/P05-VERIFICATION.md. The skill was visible in this session's catalog, but native menu selection was not tested. Claude Code and OpenCode were unavailable as active sessions; their native command invocation remains P07 release verification. Do not describe those hosts as live-verified from file-layout tests.

### P06 — completion, logs and optional local history (completed)

Dependencies: P02, P05. Make verified completion/evidence logging and skipped/snoozed state convenient to the interactive agent without requiring a database for drafts. Preserve file formatting, source ownership and conflict behavior. Add artifact/review helpers only where they improve a concrete workflow.

Implemented task-linked, no-overwrite evidence records in the selected project's marketing logs. Draft records need no database; local artifact references are hashed. The interactive `complete` command requires a matching reviewed `verified-complete` record hash and rejects skipped/snoozed tasks until reactivated, while P02 still owns the byte-preserving checkbox write. Optional `state`/`disposition` commands expose skipped/snoozed/active status in one chosen local registry without changing source task files. The helper validates evidence structure and revision, not the truth of a provider action. Existing project ledgers remain project-owned; no generic artifact approval or publishing helper was added.

### Conversational onboarding refinement (implemented; live acceptance pending)

Setup, drafting, revisions, and status now share conversational routes in `templates/WORKFLOW.md`. `templates/SETUP.md` directs the active agent to handle builds, preview/review/apply, and returned hashes using the existing guarded installer. Source instructions and installed wrappers route to that contract. README and the BarGPT smoke test use natural-language prompts; a draft alone needs no installation. No runner, dependencies, database requirement, or installer bypass was added.

Validation: `npm run check` passed 55/55 tests, including installed resource/link checks after relocation and removal of the original bundle. The package dry run includes the new setup procedure and smoke guide. This verifies packaging/helpers; real conversational setup and native menu invocation remain acceptance work.

## Public-readiness hardening — 2026-10-10 (technical changes complete; acceptance pending)

Patched dependency advisories, enabled GitHub Dependabot alerts/security fixes and enforced PR/CI protection on main. Updated early-access positioning, review-write documentation and CI compatibility evidence. Local typechecks, 71 tests, production build, package dry run and zero-vulnerability audit passed. Native-host and outside-user gates remain open in docs/maintainers/ACCEPTANCE.md; P07 is not complete. See HANDOFF for exact settings and publication status.

## Release validation in progress

### Safety and founder positioning follow-up — 2026-10-12 (implemented locally)

User-requested follow-up to the repository review. WORKFLOW v0.13 and setup reference a portable privacy procedure for minimal source reads, secret/customer-data exclusions, sanitized external queries, untrusted source instructions and media review. README leads with founder outputs, persistent context, explicit bring-your-own-agent costs, qualified read-only/privacy boundaries, and a combined setup/first-draft request. SECURITY.md documents actual boundaries and sanitized reporting. Removed the stage-all/direct-main helper and updated contribution guidance.

Completed a sourced fictional draft/revision/status walkthrough in the current Codex session using local helpers directly; source remained unchanged and the review task stayed open. Native host menus, conversational discovery, outside-founder trial and live providers remain open gates. Existing installed workspaces need a reviewed upgrade to receive the new workflow/privacy resource. No dependencies, source-access sandbox, portfolio migration, publication or Git action added. See HANDOFF for validation.

### P07 — reusable distribution/release (local distribution and public source complete; live gates open)

Dependencies: P04–P06. Verify clean-machine skill/command installation and native invocation in Codex, Claude Code and OpenCode, supported hosts/OS versions, license/provenance, removal/upgrade behavior and an outside founder's first useful draft. Keep npm publication and remote pushes explicit separate actions.

The packed package installs offline in an isolated temporary prefix, onboards/removes/reinstalls a fictional product, and passes 55 tests. Package contents now exclude internal planning/handoff records, MIT metadata is explicit, and reviewed removal preserves product data and customized wrappers. Public source is at `https://github.com/apsquared/promotion-agent`; the initial Ubuntu/macOS GitHub Actions check passed on Node 22.14.0. That CI run adds automated coverage, while the end-to-end install evidence remains macOS 14.5 arm64/Node 22.14.0 only. Native menu invocation in all three hosts, an outside founder's first useful draft, broader host/OS acceptance and npm publication remain open release gates. Follow the concrete sequence in docs/maintainers/RELEASE.md; do not mark P07 fully complete from local helper tests or the source push.

## P08 — optional local Next.js review desk (completed locally)

User-requested addition on 2026-09-28, after the P01–P06 foundations. P07's external host/release gates remain open independently. Conversation stays primary; a compact inbox shows current project tasks, saved draft/evidence previews and selected SQLite registry state/history. Copyable prepare/revise/action/verify prompts are the primary action. No AI runner, database-only completion, browser mutation API or automatic publishing.

The app uses Next.js App Router/React, an authenticated server read route, and a loopback launcher. Review consumes files and SQLite without reconciling or changing them. Vercel build configuration is included; hosted data delivery and authentication remain separate future work. Validation: `npm run check` passed both typechecks and 61/61 tests; `npm run review:build` passed. A production server was exercised in the browser with a temporary fictional product/registry: draft preview, real clipboard contents, review notes, status/search filters, database history, completed-task verification, anchor navigation/refresh and desktop/mobile layout. No real product, provider or hosted deployment was exercised.

## P09 — competitor research activity (completed; live research acceptance not exercised)

User-requested marketing activity on 2026-09-29, using the P03 shared workflow, P04 portable installation, P06 evidence helpers and P08 review handoff. Add a sourced competitor comparison and verified mention discovery, with channel/source context, duplicate handling and ranked opportunities. Dedicated Codex skill and Claude Code/OpenCode commands must point to one canonical research procedure. Reports and optional reply drafts do not authorize posting or recurring monitoring.

Acceptance: source/installed entrypoints resolve after relocation, upgrades preserve customizations and removal respects ownership; a `competitor` task can prepare, record a draft report, and surface its contents and evidence in the review handoff while remaining open. Validation: Skill Creator reports `Skill is valid!`; `npm run check` passed both typechecks, the helper build and 63/63 tests, including portable entrypoint ownership/link coverage and a task-to-report-to-review handoff. Package dry-run includes the activity resource. Live search quality and native host invocation remain separate from these deterministic checks.

## Repository search skills — 2026-10-09 (completed)

Copied the local `reddit-thread-search` and `x-post-search` folders into `.agents/skills/`, including the Reddit query reference, skill UI metadata and X search script. Added shared-workflow guidance and replaced machine-specific script paths with skill-relative paths. These are checkout resources; portable onboarding remains unchanged. Script syntax/help and reference checks passed; live search and native skill invocation were not exercised.

## SEO skills from Illyism/seo-skills — 2026-10-13 (completed)

Reviewed all eleven upstream skills. Copied `seo-title-optimization` and `blog-refresher` into `.agents/skills/` and `.claude/skills/` with shared-workflow guidance, UI metadata and the upstream MIT notice; README credits Illyism/seo-skills. The rest were declined for conflicting with draft/review, requiring paid services, or duplicating existing activities (reasons in the handoff). All eight checkout skills are now mirrored into `.claude/skills/` (Codex `agents/` metadata excluded), guarded by `tests/skills-mirror.test.mjs`. Checkout resources only; portable onboarding unchanged. Link, metadata and mirror checks passed; native invocation and live research were not exercised.

## X Growth Mentor — 2026-10-10 (implemented as checkout resources)

Added account audits, customized growth plans, persistent account/task/metric records and ongoing mentorship. Codex, Claude Code and OpenCode entrypoints route through WORKFLOW v0.8 to one canonical activity under templates/activities/x-growth/. Personal accounts need no product registration; product accounts retain the existing observer workspace boundary. Research notes review the requested Paul article against primary X ranking, policy and analytics sources. Planning remains interactive with applicable authorization for public actions or reminders.

Validation: Skill Creator validation, local reference/UI metadata/portability checks and git diff checks passed; npm test rebuilt the helpers and passed 68/68 tests. No core helper or installer changes. Portable onboarding does not install the new entrypoints; native host invocation, live account auditing and growth outcomes remain unverified.

## Natural task and review desk follow-ups — 2026-10-10 (implemented)

The shared workflow now asks a brief contextual question when giving actionable recommendations: offer to save the recommendation as a persistent task or open the review desk when reviewing saved work would help. Accepted offers are handled by the agent, with duplicate checks, existing selection/setup boundaries and no repeated confirmation for already requested work. Applies across activities, including X growth coaching. Documentation-only change; validation and limits are recorded in HANDOFF.

## Simpler review desk — 2026-10-10 (implemented)

User request: one description and one prompt per task, clearly labeled for the promotion agent or the product repo (category `product`). Drafts/evidence previews, intents, notes and the history view were removed. See HANDOFF for validation.

## Agent-run task chains and completion results — 2026-10-10 (implemented)

User request: tasks know they can create follow-up tasks so the agent is always acting or queuing the next action, and task prompts ask for an Outputs / Impact / Next steps completion summary that the review desk shows for done tasks. WORKFLOW v0.9. See HANDOFF for validation.

## Mark tasks from the review desk — 2026-10-10 (implemented)

User request: manually mark a task complete or skipped in the review desk. Adds a session-token POST route that reuses the hash-checked record/complete/disposition helpers (needs `--database`). Supersedes the "no browser mutation API" line above for these three actions only. See HANDOFF for validation.

## One review desk for all projects — 2026-10-12 (implemented)

User request: one running review desk (one URL) with a consolidated board and a per-project board, instead of a separate run and URL per project. The launcher takes repeated `--project` or, with only `--database`, every registered promotion workspace. Actions carry a project ID. WORKFLOW v0.11 tells agents to run one desk. See HANDOFF for validation.

## P12 — product video activity (implemented; live render acceptance not exercised in this change)

User request, 2026-10-10. Depends on P09's activity/entrypoint pattern, P06 evidence helpers and the review desk. Add activity `video` for short product videos (tours, promos, feature clips): HyperFrames through `npx` when available, a Playwright + ffmpeg slideshow otherwise. One canonical procedure at templates/activities/video/WORKFLOW.md, with capture, audio, frames and fallback references distilled from the 2026-10-10 BuyerCue site-tour run. Thin `promotion-video` Codex skill and `/promote-video` Claude Code/OpenCode commands in source and installed workspaces. WORKFLOW v0.10 routes "Make a video" requests and adds the budget row (one video, or one cut plus its aspect variants; output: approved script, MP4, contact sheet, evidence). Boundaries: project in the workspace under marketing/assets/videos/, product repo read only, no publishing, script approval before voice, signed-out captures, no sign-in/API keys/paid credits/global installs for the user, no new npm dependency.

Acceptance: route test; source and installed entrypoints resolve to the one procedure after relocation, upgrades preserve customizations and removal respects ownership; a `video` task prepares, records draft evidence for an MP4 and its contact sheet, and appears open in the review desk with both references. Package dry-run includes the activity. Not covered by deterministic tests: HyperFrames itself, HeyGen auth, Playwright/ffmpeg and render quality. See HANDOFF.

P12 follow-up, 2026-10-11: added templates/activities/video/craft.md, adapted from Amanda Sartini's launch-video article (X, 2026-10-10), and wired it into the brief defaults, script/storyboard, audio beat grid, frames, checks, variants and fallback. Docs-only apart from one prompt-fallback line; see HANDOFF.

P12 standalone skill, 2026-10-11: added `skills/product-video/` to the independent skills collection, a self-contained version of the activity with no workspace or registration. Its `references/` are byte-identical to the activity's reference files (now location-neutral), enforced by a test. See HANDOFF.

P12 chat replay (prototype), 2026-11-01: added `templates/activities/video/chat-replay.md` and the dependency-free `chat-replay.mjs`, mirrored into the standalone skill's references. A real assistant transcript is cleaned to its gist into `replay.json` (every user/thinking/tool/assistant/widget beat cites its transcript turns) and generated into a HyperFrames composition in a recognizable chat skin (`claude`, or `codex` for the light Codex desktop app with its window, project and thread list; 16:9 only) with typing, thinking, tool cards, streamed markdown, auto-scroll, captions and one zoom per point. Also adds `--skip-skills` to every `hyperframes init` instruction. Fictional example in `examples/chat-replay/`. See HANDOFF.

## P13 — generic post scheduler with optional Post Bridge (implemented; live provider acceptance not exercised)

Scope change requested by the user on 2026-10-12. Earlier this plan excluded app-owned publishing connectors, ARCHITECTURE said no publishing connector is introduced, and EXTRACTION records "mandatory Post Bridge" as a legacy problem that was removed. The user now wants optional Post Bridge support behind a generic scheduler, because a real Idea Launch run on 2026-10-12 showed the agent could schedule through the user's own Post Bridge setup, and that doing so without a written contract left each provider limit (no X threads, stripped links, account matching, the open verification) for the agent to discover. Depends on P06 evidence helpers, the review desk and WORKFLOW v0.11.

The properties behind the earlier exclusion are kept:

- **Optional.** No project needs Post Bridge. `manual` is the default adapter, and a configuration without `scheduler` means manual.
- **No background runner.** Promotion-agent never runs a timer, daemon, cron or queue. A scheduled time is held by the provider or the human; the agent acts only inside a user conversation.
- **No stored credentials.** Promotion-agent never stores, reads or asks for a provider API key. The configuration has no credential fields.
- **No new npm dependency.** The agent runs `npx postbridge-cli` (or Post Bridge's MCP tools) in its session under the user's host permissions. Promotion-agent's own code makes no provider calls.

Delivered: one adapter-neutral procedure at templates/publishing/WORKFLOW.md (operations capabilities, accounts, fit, schedule, status, update/cancel, verify; lifecycle, approval, UTC conversion, duplicate check, post-log and evidence bookkeeping, follow-up) with `manual.md` and `post-bridge.md` beside it. WORKFLOW v0.12 routes "Post this" / "Schedule it for Tuesday 9am" there and sends scheduling in Review and action and Tasks and evidence through the selected adapter. Optional `scheduler` project setting (`adapter`, per-channel `accounts`; `post-bridge` requires `policy.publish: exact-content-review`), named apart from the legacy agent-run `scheduleSchema`/`adapterCapabilitiesSchema`. Scheduled posts are `draft` evidence in a labeled summary shape; the review desk shows them read only. No entrypoints were added. Installed workspaces receive this only through a reviewed upgrade.

Acceptance: config default/rejection tests, route and source/installed procedure tests, the scheduled-task bookkeeping path through the review desk and `complete`, a no-provider-call check, and the package dry-run. Not covered by deterministic tests: Post Bridge itself, its CLI behavior, account connection, link stripping and actual publication. See HANDOFF.

## P14 — “I shipped this” launch packs (implemented locally)

Depends on the shared workflow, P10 observer boundary, P06 evidence/tasks, P12 video and P13 publishing. WORKFLOW v0.14 routes ordinary shipped-since-date/changelog requests to `templates/activities/release/WORKFLOW.md`. One pack freezes exact source IDs or a hashed changelog, maps every claim to implementation and separate deployment evidence, checks prior packs/overlapping changes, and saves coordinated X announcement, release notes, customer explanation and demo storyboard under a stable release UUID bound to the workspace project UUID. Versioned drafts/claim history/status/task references use existing files and helpers, with no new database or runner. Unknown deployment stays unresolved; internal-only work and undeployed features do not enter availability copy.

The optional read-only `release-source` helper uses Git argument arrays to resolve local refs, require complete ancestral history and return bounded filtered names with full IDs. It returns no diff, messages, authors or deployment assertion and leaves the source unchanged. The task prompt builder supplies a `release` fallback (`launch` retains its existing directory-submission meaning). Review/fact-check tasks use `release`, renders use the existing video activity and approved posts use the publishing workflow. No new dependency or host entrypoint.

Acceptance: automated source-boundary/ID/filter/limit/portable-resource/task-evidence tests and a current-agent fictional three-change walkthrough with two draft versions, a source/claim table, three open follow-ups and byte-identical source/Git files. See [the saved example](../../examples/release-pack/README.md) and HANDOFF for execution evidence and limits. Installed workspaces receive the new procedure/helper only through a reviewed upgrade. Native invocation, live deployment/provider checks and rendering remain separate verification work.

## P15 — first 10 paying customers sprint (implemented locally)

Depends on project/workspace identity, competitor and conversation research, existing task/evidence/disposition helpers and the shared interactive workflow. WORKFLOW v0.15 routes the first-customers request, selected-sprint “What should I do today?” and results updates to `templates/activities/acquisition/WORKFLOW.md`. A stable sprint record owns audience, sourced offer, customer/payment definition, minutes, separate baselines and total/additional target, ranked opportunity history, historical action/outcome evidence and dated reviews. Immutable version snapshots preserve learning; the existing project TASKS.md remains the only executable board. Queue only the next few actions, respect skipped/snoozed work, and retain the wider shortlist in the plan. Replies/offers remain unsent until authorized.

`src/interactive/acquisition.ts` and read-only CLI `acquisition-status` validate saved identity/history, canonical opportunity deduplication and evidence basis, keep distinct paying/trial/signup and reported/verified progress, deduplicate repeated outcome units, and select at most three suggestions within daily minutes using the existing board/dispositions. A reported action awaiting verification is never suggested as another send. Unknown baseline is not zero; research/action completion cannot achieve the customer objective. No new sending integration, task board, dependency, project config field, database table, background execution or UI action.

Acceptance: `npm run check` passes both typechecks, helper build and 96 tests, including seven new fictional acquisition cases for canonical thread aliases/duplicate rejection, strict records, reported/verified/category/count corrections, cross-process and relocated resume, daily budget, skipped/snoozed/corrupt-or-missing state, immutable source and task bytes, separate research completion, unsent/previously reported actions and shared installed resources. Package/link validation and limits are recorded in HANDOFF. Native conversational execution, live research quality, actual sending/payment confirmation and acquisition results remain unverified. Existing installed workspaces receive this only through a reviewed upgrade.

## P16 — AI visibility activity (P16a implemented locally; live probing not exercised)

User request, 2026-10-21: help a product get recommended by ChatGPT, Claude, Gemini, Perplexity and similar assistants. Research, rationale and decisions are in [AI-VISIBILITY.md](AI-VISIBILITY.md). Depends on the shared workflow, P06 evidence helpers, P09 competitor research and the review desk.

P16a delivered: WORKFLOW v0.16 routes "How do we show up in ChatGPT?" / "Run an AI visibility check" to activity `visibility` at templates/activities/ai-visibility/WORKFLOW.md, with record shapes in RECORDS.md, a budget row and a duplicate rule. The procedure covers a user-approved, versioned 20–30 prompt set; probes with the `manual` (user-pasted answers from short probe sheets, at most 20 pastes each by default, with coverage tracked across sheets) and `session-search` (Bing/web results, crawler access, rendering, indexing, identity consistency) adapters only; mention rates as k of N; sources only from returned citations; a ranked citation gap map; at most three follow-ups through existing categories plus a re-measure not before four weeks out; and training-crawler access as a per-product choice. Thin `promotion-visibility` skill (mirrored to `.claude/skills/`) and `/promote-visibility` commands in source and installed workspaces; task category `visibility` (aliases `ai-visibility`, `geo`, `aeo`) gets a prompt fallback. No AI provider calls, keys, dependency, config field, database table or background process. The `engine-api` adapter (P16c) is deferred by the user's decision.

Acceptance: `npm run check` passes both typechecks, the build and 101 tests, including three new fictional cases (route, budget and boundary text; source and installed entrypoints after relocation, upgrade preservation and owned removal; a `visibility` task recording draft RUN.md and GAPS.md evidence and staying open in the review handoff). Native invocation, live probing, engine behavior and actual visibility changes are not covered. Installed workspaces receive this only through a reviewed upgrade.

## P17 — keyless domain rank check (implemented locally)

User request, 2026-10-23: check a domain's rank using only free approaches that need no key, including public tool websites driven through the browser. WORKFLOW v0.17 routes "What's the domain rank of example.com?" to the shared lookup at templates/activities/domain-rank.md, which the competitor and AI visibility activities link for weighing competitor and cited domains. Sources: Open PageRank's top-domains lookup and Tranco's rank endpoint over plain HTTP; Ahrefs Website Authority Checker (DR), Moz Domain Analysis (DA) and Similarweb in the browser for a shortlist. No API keys, accounts, CAPTCHA solving, task category, budget row, helper code or dependency; unavailable or blocked sources are recorded as such.

Acceptance: `npm run check` passes, including `tests/domain-rank.test.mjs` (route, links from the workflow and both activities, sources and boundaries). Each source was exercised live once on 2026-10-23; page layouts can change, so the procedure records `not found` rather than guessing.

## P18 — high-quality promotion opportunities (implemented locally)

User request, 2026-10-30: build the reviewed opportunity-research skill; consider only high-quality sites with traffic or SEO benefit and verify that every opportunity remains valid. Depends on the shared workflow, directory/link tracking, P06 evidence, P09 research and P17's supporting domain lookup.

One canonical procedure under `templates/activities/promotion-opportunities/` admits a prospect only after quality/relevance, at least one evidenced value route and current first-party availability/eligibility checks pass. Unknowns stay outside the shortlist; later actions require revalidation. Dated source notes retain the supplied X article as discovery only. Thin Codex/Claude Code/OpenCode entrypoints, mirrored checkout skills, installer support and a placement-qualification prompt section that survives custom task steps share this contract. Existing categories, evidence and private workspace records are reused; no provider, dependency, metric threshold, schema or background action.

Acceptance: Skill Creator validated both checkout skill copies; `npm run check` passed both typechecks, build and 105/105 tests. New integration coverage checks source/installed reference portability after relocation, preservation of customized wrappers/procedures and marketing tasks, and removal of unchanged owned entrypoints. The prompt regression checks that custom instructions and legacy directory/backlink/launch categories retain qualification. A manual instruction review covered six fictional evidence cases; see HANDOFF for decisions and limits. Native invocation, an independent behavioral evaluation, real product research, submission and traffic/SEO outcomes remain unverified. Existing workspaces receive the skill through a reviewed upgrade.

## Source checkout and promotion workspace clarity — 2026-10-31 (implemented locally)

Depends on P10/P11's separate-workspace setup and P04's portable installer. The source checkout is explicitly the development repository and current setup source; the private promotion workspace is the everyday usage folder; the product repository supplies read-only facts. README has separate use/contribute paths, and contributor, user, host compatibility, setup and architecture guidance follow the same roles. WORKFLOW v0.19 requires a concrete handoff to the workspace for future chats while retaining checkout-only feature limits.

The installer adds thin root AGENTS.md/CLAUDE.md usage instructions using existing reviewed ownership rules. Unmanaged/customized instructions are preserved. Review-desk promotion prompts now direct users to the selected product's promotion workspace; product tasks still target the product repository. Source-based installation, optional review-desk distribution and checkout-only skills remain accurately documented. No mode toggle, new dependency, public installer, publication or real workspace migration is introduced.

Validation: `npm run check` passed both typechecks, build and 105/105 tests. Existing installation integration tests now cover root instruction portability after relocation/removal of the original bundle, preservation of customized instructions during removal, and removal of unchanged managed instructions. Existing tests retain pre-existing instruction preservation, upgrade and source-boundary coverage. Changed Markdown file links and `git diff --check` pass. Native host invocation and an outside-user setup trial remain open P07 acceptance work; see HANDOFF.

## Deferred unless separately requested

Clone-free public installation: follow up after the source/workspace clarity change above. Define a supported versioned setup interface, package the remaining checkout-only skills and a supported review-desk launch path, then verify clean installation, native host invocation, workspace upgrades and preserved customizations. npm identity, nonzero version, publication and public install verification remain P07 gates. No public `init` command is implemented or advertised as available by the clarity change.

Commit/push convenience script: retired on 2026-10-12 during the safety review follow-up. Contributions use reviewed, scoped changes through a pull request; no stage-all/direct-main helper remains. See HANDOFF.

AI subprocess runners, model/auth management, background execution, autonomous scheduling, app-owned publishing connectors (code in promotion-agent that calls a provider, stores its credentials or holds a scheduled time; P13's agent-run optional Post Bridge adapter is not one), hosted services, paid advertising, auto-sending outreach and unrestricted plugin execution. Existing legacy board material in reference/ remains design source only.

## Verification

Run `npm test` for code changes and record current results in docs/maintainers/HANDOFF.md. Skill metadata checks and native syntax documentation do not establish native menu execution. Helpers run locally on Node 22.14+, use fictional tests, and do not need model credentials or external services.

## Standalone AI skills collection — 2026-10-11 (implemented locally)

User-requested `skills/` collection, independent of the promotion workflow and installer. First skill: `mcp-ify`, with concise Agent Skills metadata/instructions, Codex UI metadata, focused implementation references, and four adaptation examples. `skills/readme.md` documents the catalog, installation, updates, removal, and contributions; root README links it. No core/runtime changes or dependencies. Skill Creator validation and relocation/link/UI metadata checks passed; native invocation and actual SaaS implementation remain unverified. See HANDOFF.

Standalone skill, 2026-10-19: added `skills/nurture-campaign/` (lifecycle email sequence for a product's registered users) from a user-supplied brief, with catalog and README entries. Docs-only; native invocation unverified. See HANDOFF.

Standalone skill, 2026-10-25: added `skills/agent-ready/` (make a product usable, installable and findable by AI agents: live audit, surfaces, packaging, discovery assets, dated directory catalog, agent-use-case marketing; MCP server work handed to `mcp-ify`) from a user-supplied brief, with catalog and README entries and a dependency-free distributable-secrets check. Docs and one skill script; native invocation unverified. See HANDOFF.

Standalone skill, 2026-11-01: chat replay (P12) became `skills/chat-replay/` so it can be installed on its own (`npx skills add apsquared/promotion-agent --skill chat-replay`): a self-contained SKILL.md, `scripts/chat-replay.mjs`, `references/replay-format.md`, the fictional example (moved from `examples/chat-replay/`) and Codex metadata. The video activity keeps a byte-identical copy of the script for installed workspaces; `product-video` drops its copies and points to the new skill. Native invocation unverified. See HANDOFF.
