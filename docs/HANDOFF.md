# Continue here

## Standalone skills collection — 2026-10-11

Created `skills/readme.md` and `skills/mcp-ify/` from the user-supplied brief. The 59-line SKILL.md routes to design/access boundaries, authentication/connection UX, conditional spending controls, verification/activation, and four fictional adaptation scenarios. Generated `agents/openai.yaml` with Skill Creator. The collection is self-contained, has no promotion-agent runtime dependency, and is not installed by portable onboarding. README installation now leads with the documented skills.sh CLI (`npx skills add apsquared/promotion-agent --skill mcp-ify`), optional agent/global flags, and a local-checkout command until the skill is pushed. Manual copying remains a short fallback. Root README links the catalog.

Validation: Skill Creator `quick_validate.py` passed on source and an isolated relocated copy; every relative Markdown link within the copied skill resolved; UI metadata length and invocation prompt checks passed; `git diff --check` passed. Reviewed the four scenarios against the brief for conditional questions/controls, existing-server reuse, scope, and evidence reporting. This was a static scenario review, not an independent agent execution or live integration test. No runtime code changed, so npm tests were not rerun. CLI syntax was checked against the upstream vercel-labs/skills README; the installer was not executed. No global installation, SaaS modification, provider configuration, deployment, commit, or push occurred.

## P12 follow-up — video craft rules — 2026-10-11

User request: use Amanda Sartini's X article "12 rules for a launch video that looks like a design studio made it" (https://x.com/AmandaSartini/status/2109017063205302326, posted 2026-10-10, read signed-out in the in-app browser) to make better product videos. Added `templates/activities/video/craft.md`, a paraphrased and attributed adaptation: 30 s shape (4 s hook, numbered ~4 s feature beats, 2 s close), hook in the first frame, trigger → visible reaction → still payoff, sound-off text blocks (eyebrow, two ~14-character headline lines, one sentence under 80), measured dot-and-label callouts held ~1 s with no camera move, calm frame and colourful product, eased ~1 s camera moves capped near 1.5× on phone screens, cuts on the music's bars, one dark contrast scene, product-not-logo ending, vertical laid out rather than cropped, fictional demo data with only real features, and a pre-render checklist.

Adapted to existing boundaries: shortened on-screen copy goes beside its approved source in SCRIPT.md for approval; invented data must be clearly fictional, never a real person's, and never presented as metrics; tempo comes from `npx hyperframes beats` on the actual track, and narration timing wins over the grid. WORKFLOW defaults now recommend a 30 s promo / 45–60 s tour and text-only built for sound off (narration optional). Updated WORKFLOW brief/design/script/storyboard/checks/variants, audio.md (beat grid), frames.md (camera, callouts, rebuilt UI, two-line headline height), fallback-slideshow.md and the `video` prompt fallback (0.0 s snapshot and checklist).

Validation: `npm run check` passed both typechecks, build and 74/74 tests; the existing video test confirms craft.md is linked from the procedure and that every link resolves in source and installed copies. `git diff --check` passed. Whether these rules produce better renders was not tested; no video was made. Not committed.

## P12 — product video activity — 2026-10-10

User request: a `video` activity that makes short product videos for a registered product, with HyperFrames (`npx hyperframes`) preferred and a Playwright + ffmpeg slideshow fallback. The procedure is distilled from the BuyerCue site-tour run on 2026-10-10; HyperFrames' own skills stay the source of truth for its internals.

Added:

- `templates/activities/video/WORKFLOW.md` (canonical procedure: boundaries, availability check, brief, capture, design, script/storyboard, audio, frames, assemble/check, review/render, aspect variants, record) with `capture.md`, `audio.md`, `frames.md` and `fallback-slideshow.md` beside it. Records the run's pitfalls: third-party logo badges, cream-to-white colour mapping, short BGM looped with `acrossfade`, a 44 s SFX, retiming to word timestamps, the 48 KB packet limit, digit-leading frame ids, font files, clip ids, overflow/overlap attributes, the 83% safe area, measured highlight targets and wrapping headlines.
- WORKFLOW v0.10: "Make a video" / "Turn the site into a demo video" route, video duplicate check, and budget row (one video, or one cut plus its aspect variants → approved script, MP4, contact sheet, evidence).
- Thin entrypoints: `.agents/skills/promotion-video/` (with UI metadata), `.claude/commands/promote-video.md`, `.opencode/commands/promote-video.md`. The installer generates workspace versions of all three and documents them in INSTALLED.md.
- `video` prompt category with a fallback step list (workspace project, auth status, consent for sign-in/credits/installs, signed-out captures, script approval before voice, snapshots before render, draft evidence, no publishing).
- Template notes: TASKS.md `video` category, AGENT.md enabled activity and video projects line, activity-log activity list. Installed workspaces receive these only through a reviewed upgrade.
- README, INTERACTIVE and ARCHITECTURE sections; PLAN P12.

Validation: `npm run check` passed both typechecks, the helper build and 74/74 tests (three new in tests/video.test.mjs: workflow route, budget row and linked references; source and installed entrypoints resolving to the one procedure after relocation, customization preserved on upgrade and removal; a `video` task through prepare, draft evidence for a synthetic MP4 and contact sheet, and the review desk while still open). Skill Creator `quick_validate.py` reported "Skill is valid!" for `promotion-video`. `npm pack --dry-run --ignore-scripts` with a private temporary cache lists all five `dist/templates/activities/video/` files. `git diff --check` passed.

Not verified by these tests: HyperFrames itself, HeyGen auth (`auth status`/`auth login`), TTS/music/SFX services, Playwright, ffmpeg, render quality, and native invocation of the new entrypoints. The evidence test uses a few synthetic bytes, not a real render. No dependency was added; no workspace was upgraded, nothing was rendered, published or committed.

## Public-readiness hardening — 2026-10-10

Updated Next.js to 16.4.0 and transitive source-map-js to 1.2.2. The current npm audit reports zero vulnerabilities. Both typechecks and 71/71 tests passed, the production review build passed, and the package dry run passed. No new dependencies or runtime feature changes were introduced.

Enabled and read back GitHub Dependabot alerts (204) and automated security fixes (enabled, not paused). Main now requires a pull request and up-to-date `check (ubuntu-latest)` and `check (macos-latest)` checks, including administrators; force pushes and deletion are disabled. Zero reviewer approvals are required so a solo maintainer can merge after CI. The direct-main commit/push convenience script is incompatible with this policy and was not run.

README now labels source distribution early access. Architecture/README describe authenticated local complete/skip/resume actions; compatibility distinguishes Ubuntu/macOS automated CI from native agent acceptance. docs/ACCEPTANCE.md tracks native Codex/Claude Code/OpenCode trials and an outside user's first useful draft as pending. These need actual interactive sessions/participants and cannot be established by helper tests. No invitations, npm publication, commit or push occurred; dependency and documentation changes remain local until explicitly published.

## Mark tasks complete or skipped from the review desk — 2026-10-10

User request: the desk needs a way to manually mark a task complete or skipped. Each open task now has **Did it yourself, or not doing it?** with an optional note, **Mark complete ✓** (confirm dialog) and **Skip**; skipped/snoozed tasks show **Resume task**. `POST /api/review` (same token/origin guard as GET, JSON only, 16 KiB cap) calls `src/review/actions.ts`, which reuses the hash-checked helpers: completion records a `verified-complete` record (Outputs = the note, tagged "marked complete by hand in the review desk"; reference = the task file) and then `completeSelectedTask` checks the box; skip/resume use `setSelectedTaskDisposition`. Completing a skipped/snoozed task is refused until resumed, before any record is written. The client sends the loaded revision, so a changed task file is refused. Actions need `--database`; without it the desk says so. This lifts PLAN's earlier "no browser mutation API" rule at the user's request; completion still writes the workspace checkbox, not database-only state.

Validation: `npm run check` passed both typechecks and 71/71 tests (two new: skip/resume/complete through the actions module including stale-revision, parked-task and no-registry refusals; route auth, origin, content-type, stale revision and success). Browser-checked against a scratch copy of examples/example-desk with a scratch registry: skip with a reason kept the task selected and labeled, Resume cleared it, Mark complete moved T-001 to Done showing the note as Outputs and checked `- [x] T-001` in the scratch TASKS.md. The confirm dialog was stubbed during that run. No commit, push or external action.

## Agent-run task chains and completion results — 2026-10-10

User goal: the agent runs most of the marketing, so it should always be taking an action or queuing one. WORKFLOW is now v0.9 with a **Keep the work moving** section: every run and every task ends with the next action taken or queued as a task; any task may add up to three deduplicated, executable follow-ups (`Follow-up to T-NNN.` in Materials, earliest date/trigger allowed) without asking; pending human steps count as queued actions; saturated activities say what would unblock them. In a registered workspace, actionable recommendations are now filed as tasks directly and reported by ID instead of offered (declines become `skipped` dispositions, or the just-added entry is removed). The status route and competitor activity queue follow-ups the same way. Product-repo agents list follow-ups in their summary for the promotion agent to file.

Completion results: the `verified-complete` evidence summary now uses `Outputs:`, `Impact:` and `Next steps:` lines (expected effects labeled, never presented as measured). Both desk prompts include that shape. `reviewData` exposes each task's newest `verified-complete` record as `completion`; `completionReport` in src/review/prompts.js splits it into sections, with plain-text fallback for older summaries. Clicking a Done task shows the result with date and evidence link, or says no summary was recorded. No schema or helper change.

Validation: `npm run check` passed both typechecks and 69/69 tests (new test covers the completion field, section parsing and plain-text fallback; prompt tests assert the follow-up and summary instructions). Browser-checked the desk against a scratch copy of examples/example-desk with a recorded T-001 completion: Done shows Outputs/Impact/Next steps and evidence link, T-003 shows the no-summary note, and the To do prompt includes both new blocks. Live agent behavior (actually queuing follow-ups) was not exercised. Installed workspaces keep their older WORKFLOW/TASKS copies until a reviewed upgrade; desk prompts come from this checkout and apply immediately. No commit, push or external action.

## Simpler review desk — 2026-10-10

The user found the desk too complex (saved drafts, evidence, intents, notes, history). It is now a task list with **To do / Done** tabs; each task shows its description (Materials) and one prompt to copy, labeled **Paste into: Promotion agent** or **Paste into: Product repo**. Tasks with category `product` target the product repository; every other category targets the promotion agent. WORKFLOW.md and the TASKS.md template document the `product` convention. Removed: intent selector, review notes, evidence/draft previews, record hashes, the database & history view and their read model. `src/review/data.ts` now reads tasks, task-linked record references (not the referenced files) and optional skipped/snoozed state. Prompts list saved draft paths so the agent resumes at the first unfinished step. `next.config.mjs` sets `agentRules: false` because `next dev` was appending a block to AGENTS.md on every launch.

Validation: `npm run check` passed both typechecks and 68/68 tests (review tests rewritten for the new read model and prompt targets). Browser-checked a dev server against the BuyerCue workspace (read only) and a scratch copy with one task relabeled `product`: both prompt variants render, copy shows "Copied ✓" (the Clipboard API is blocked in the in-app browser; the new `execCommand` fallback copied), mobile at 375px has no horizontal overflow. Installed workspaces keep their older WORKFLOW/TASKS template copies until a reviewed upgrade.

## Commit-all script — 2026-10-10

Added scripts/commit-all-main.sh: optional commit message, repository-relative execution, main-branch check before staging, origin availability check, all non-ignored changes staged, commit only when needed, and ordinary origin main push. Errors stop execution; no automatic branch switching or force push. Validation: bash -n and git diff --check passed. The script was not executed against this repository, and no commit or push occurred.

## Natural task and review desk follow-ups — 2026-10-10

Updated the canonical templates/WORKFLOW.md conversational guidance: actionable recommendations include a short contextual offer to add a persistent task or open the review desk. The agent handles accepted offers, checks for duplicate tasks, and respects existing selection, setup and external-action boundaries. Already requested work proceeds without another confirmation; personal X account task records remain supported without product registration. All three hosts inherit this behavior through their shared-workflow references; existing installed workspaces need a reviewed upgrade to receive the updated template.

Validation: inspected the shared guidance against the task template, interactive helper documentation and review desk contract; git diff --check passed. No runtime code changed, so tests were not rerun. Live conversational behavior and review desk launching were not exercised. No workspace upgrade, commit, push or external action occurred.

## X Growth Mentor — 2026-10-10

The requested X growth skill is now included in this repository. Thin Codex/Claude Code/OpenCode entrypoints load templates/WORKFLOW.md v0.8 and templates/activities/x-growth/WORKFLOW.md. Supporting references cover account diagnosis, plan persistence with stable identity, time budgets, draft coaching, experiment reviews and a sourced critique of the supplied article. Account records stay in private user data or a selected promotion workspace; personal accounts require no unrelated product registration. Public actions and recurring checks retain applicable explicit authorization.

Verification: Skill Creator returned “Skill is valid!”; all local activity/skill reference links resolve; UI metadata and host entrypoints passed checks; no machine-specific absolute paths or unfinished scaffold markers were found in the skill/activity files. npm test rebuilt the helpers and passed 68/68 tests; git diff --check passed. These are checkout resources, matching the existing search-skill boundary: portable onboarding is unchanged. Live account auditing, native invocation and actual growth performance were not exercised. No account actions, analytics/customer records, dependencies or provider credentials were added.

## Current direction

The user explicitly changed the design: **run as an agent interactively using skills and commands**, rather than starting agent CLIs from an application. Do not resume the old headless adapter/server roadmap.

Open this repository in the user's existing Codex, Claude Code or OpenCode session. A repo-local skill/command loads templates/WORKFLOW.md and the current agent performs the work with its available tools and conversation. There is no AI subprocess runner, authentication probe, model selection, required localhost UI, or scheduler.

## Different product and repository names — 2026-10-09

Follow-up to P11: WORKFLOW v0.7 explicitly falls back to minimal README/package identity metadata in bounded development roots even when directory names do not match the requested product. Incidental competitor/dependency/example mentions are insufficient identity evidence. SETUP preserves the verified product display name in `--name` and workspace context independently of the source basename; README documents the distinction.

Validation: `npm run check` passed both typechecks, build and **68/68 tests**. The new fictional CLI regression registers Beacon Desk from a legacy-console folder/package, checks the stored and review display names and canonical source mapping, then upgrades with the repo name and verifies the original display name/UUID and byte-identical source are retained. This verifies registration/name separation; live agent metadata discovery remains manual acceptance work. No real product repository was read or changed, and this follow-up has not been committed or pushed.

## Project registration by name — 2026-10-09

Implemented P11 at the user's request. WORKFLOW v0.6 accepts a product name and directs the active agent to find its checkout using session selections, available host saved-project inventories, private registration metadata and bounded directory-name discovery. Verify minimal candidate identity, canonicalize/deduplicate aliases, reuse matching workspace UUIDs, and honor a newly named product over earlier chat selection. The agent never asks for a filesystem path: ambiguous candidates get named choices; unavailable sources prompt opening/selecting the product or making the checkout accessible.

Updated AGENTS.md, both source Codex skills, Claude Code/OpenCode promotion and competitor commands, generated installed wrappers, setup and user/developer documentation. Discovery allows targeted identity metadata reads without loading unrelated marketing records. Registration still passes resolved paths to existing guarded helpers; no discovery service, dependency or installer bypass was added. Existing installed workspaces require a reviewed upgrade to receive this workflow; no real workspace was upgraded here.

Validation: `npm run check` passed helper/frontend typechecks, build and **67/67 tests**. A temporary fictional installation preview verified the built workflow/setup link and all six generated host entrypoints carry name discovery. `git diff --check` passed. Manual smoke guidance covers brand/folder aliases, ambiguous checkouts, stale registrations, unavailable sources, selection changes and UUID reuse. Live discovery across native hosts has not been exercised. No other product repo was scanned or modified, and no commit, push or external action occurred.

## Repository search skills — 2026-10-09

Copied `reddit-thread-search` and `x-post-search` from the user's local skill collection into `.agents/skills/` at their explicit request; the `.agents` and `.codex` source copies were identical. Included the Reddit reference, both UI metadata files and the X script. Added guidance to follow the shared workflow, select queries for the actual product and retain draft/review boundaries. X command examples now use paths relative to the skill directory instead of a machine-specific path. README identifies these as checkout resources; the portable installer is unchanged.

Verification: X script `node --check` and `--help` passed; copied reference/workflow links resolve, no machine-specific paths or credentials were found in the added files, and `git diff --check` passed. No core code or dependencies changed, so the core test suite was not rerun. Live search, native skill invocation and portable installation of these skills were not exercised. No commit, push or external action occurred.

## Current observer boundary — 2026-10-09

The user changed the ownership model: treat real product repos as read-only observed sources and keep promotion-agent’s internal bookkeeping outside them. P10 supersedes historical product-local installation and marketing storage described below.

The supported CLI now onboards with --project <source> and --workspace <external-directory>; all subsequent commands select the workspace with --project. The workspace holds runtime, host wrappers, stable-ID config, promotion-source.json with the local canonical source mapping, and marketing facts/tasks/drafts/logs/evidence. Default workspace selection in conversational setup is ~/.local/share/promotion-agent/projects/<UUID>. Helpers require existing directories; the agent handles creation. Source/workspace overlap, aliases and plan/database outputs inside the source fail before writes. Completion updates only workspace tasks.

Review data/UI/prompts now identify both locations and retain the observer boundary. All three host entrypoints and the shared workflow/setup/docs are aligned. Product changes stay recommendations until separately requested. Existing product-local installations and history are left untouched; import/cleanup are separate explicit tasks. Legacy low-level library APIs remain compatible for stored data/tests; host permissions and workflow govern raw agent tools.

Validation: npm run check passed helper/frontend typechecks and 67/67 tests; npm run review:build passed the optimized Next.js build. Package dry-run confirmed the observer helper and setup resources are included; git diff --check passed. Observer tests exercise compiled CLI preview/install, evidence/read-model/prompt handoff, draft rejection for completion, validated local completion and upgrade with byte-identical source snapshots; overlap/symlink/source-output rejection; two isolated identities and workspace relocation; rejection of legacy product-local plans and changed canonical source mappings. Existing compiled standalone relocation and all core tests pass. No real product repos were read or changed. Revised UI browser interaction and native host conversation/menu invocation have not been live-tested in this task. No commit, push, deployment or public action occurred.

## Implemented

- **P01 retained:** strict typed/runtime configuration and record contracts, stable UUID/task identity, portable/local settings, draft defaults and explicit unknown facts. Historical Run/Schedule/AdapterCapabilities shapes remain compatible but do not enable background execution.
- **P02 retained:** optional SQLite registry/history, migrations and backup/export, read classification, strict reconciliation, format-preserving checkbox completion, hash preconditions, cooperative project locks, and selected-file portfolio import previews. Existing legacy parser/tests are unchanged.
- **P03 replaced:** Codex `.agents/skills/promotion-agent/SKILL.md`, Claude `.claude/commands/promote.md`, OpenCode `.opencode/commands/promote.md`; all reference the same canonical workflow.
- **Interactive helpers:** `src/interactive/tasks.ts`, `scripts/promotion.mjs`, and `npm run promotion -- ...`. Inspect/prepare are read-only; explicit completion reuses P02's locked, hash-checked write-back and optional SQLite state. No helper invokes an AI process.
- **P04 complete:** `src/onboarding/install.ts` previews and applies one explicitly selected project installation with an exact review hash, before-image conflict checks, symlink/path checks and an ownership manifest. The installed `.promotion-agent/` runtime contains compiled helpers, the shared workflow, schemas, templates, docs and license; repo-local host wrappers use relative references. Existing project instructions and product-owned content are preserved. A pinned TypeScript typecheck/build and executable package command are included.
- **P05 Codex exercise complete:** the current interactive Codex session followed the repo-local skill and shared workflow for two fictional products. Directory, social, engagement and blog drafts were written under their allowed marketing paths and logged as drafts. See `docs/P05-VERIFICATION.md` for artifacts, sources, duplicate/fit decisions and exact host limits.
- **P06 complete:** `record` creates no-overwrite, task-linked evidence accounts under the selected project's `marketing/logs/promotion-agent/` without SQLite, hashing local artifact references. `complete` requires the reviewed `verified-complete` record path/hash bound to the current task revision, and refuses skipped/snoozed tasks until reactivated. Optional `state`/`disposition` helpers expose local skipped/snoozed/active state in one chosen SQLite registry without editing TASKS.md. Existing product ledgers remain product-owned; no generic publishing or approval engine was added.
- **P07 local distribution complete; release gates open:** the private tarball installs offline into a temporary prefix and its binary onboards, removes and reinstalls a fictional project. Reviewed removal keeps product data/customized wrappers; MIT package metadata and a reduced release bundle are in place. Native host menu invocation, an outside-founder trial, other OS/version checks and npm publication remain unverified. See `docs/RELEASE.md`.
- **Public source repository live:** `https://github.com/apsquared/promotion-agent` is public under the MIT license. The source release includes a GitHub Actions check on Ubuntu and macOS; the initial run passed. This is source publication only: the npm package remains private and the live-use gates below remain open.

Removed the superseded P03 subprocess/protocol adapter files, CLI smoke script, synthetic CLI test fixture and obsolete probe evidence. The earlier CLI failures were not repaired; they are no longer prerequisites for this design. No global skills were installed, no other product repo was modified, and no model login or external account change was made.

## Conversational setup refinement — 2026-09-27

The user requested a launch-agent-style “open the repo and talk to it” experience. `AGENTS.md`, the source skill/commands, and generated installed wrappers now route setup, drafting, revisions, and status through `templates/WORKFLOW.md` v0.3. `templates/SETUP.md` tells the current agent to run local setup tools itself, inspect the actual plan, summarize changes, and apply the exact returned hash when authorized. Preview-only requests still stop for review; ordinary draft requests do not install infrastructure. No deterministic installer gates were changed.

README now leads with conversational prompts. `docs/MANUAL-SMOKE-TEST.md` walks through setup, a BarGPT draft, revision, and status without user-run terminal commands. The build ships that guide and the setup procedure. The relocation integration test checks their availability and relative links after the original bundle is removed. No real BarGPT checkout was read or modified for this change.

Validation: `npm run check` passed typecheck, build, and 55/55 tests. Package dry-run verification includes the new resources (33 files). `git diff --check` passed. Skill Creator's Python validator could not run because PyYAML is absent in both available Python environments; no dependency was added to the repository. Source skill metadata and reference paths were inspected, and existing wrapper reference tests pass. The new conversational behavior and native host invocation still require the manual smoke test; do not claim those were exercised by helper tests.

## P08 — optional Next.js review desk — 2026-09-28

The user requested a persistent local frontend while keeping conversation first, chose a compact inbox with side-by-side review, and specified Next.js as the core technology with future Vercel deployment in mind. This explicitly adds the previously deferred local UI; it does not restore the headless runner or hosted admin behavior.

Implemented:

- Next.js App Router/React in `app/`, with responsive task search/status/activity filters, current materials, task-linked evidence/text previews and a separate SQLite history view.
- Prominent copy-prompt handoff plus notes and prepare/revise/action/verify intent selection. Prompts include selected product/task identity, task-file revision, materials, destination, source steps, evidence paths/hashes and project policy. Completed tasks offer verification only. Copying does not record approval, execute actions or complete tasks.
- `src/review/data.ts` reads only the explicitly selected project and optional SQLite registry. SQLite is opened read-only, without migration/reconciliation. Missing or corrupt registries fall back to the file view; changed artifacts and stale imports are labeled. File previews reject symlinks and render supported text formats inertly, capped at 256 KiB.
- `scripts/review.mjs` launches Next.js on loopback with a random session token. The server route requires that token, validates local host/origin, accepts no browser-supplied paths and has no write methods. The token fragment is removed into session storage; ordinary anchors are not mistaken for tokens.
- `npm run review`, `review:build`, `review:start`, separate frontend typecheck, and Vercel Next.js build configuration. The helper build and portable installation still work independently. Next/React runtime dependencies and React development types were added for this explicitly requested UI.
- `docs/REVIEW-UI.md` documents launch, handoff, data ownership, source-only UI distribution and hosted deployment limits. README and architecture/plan now describe the optional frontend.

Verification on Node 22.14.0/macOS:

- Final `npm run check`: helper/frontend typechecks, helper build and **61/61 tests passed**. Six new tests cover read-only data behavior, evidence/reference changes and symlinks, selected-project isolation, corrupt registry fallback, prompt payloads and API session/origin enforcement.
- Final `npm run review:build`: optimized Next.js 16.3.6 build passed; root UI is static and `/api/review` is dynamic Node runtime. No build warnings other than Node's experimental SQLite notice.
- Browser-tested the production server against a temporary copy of the fictional Example Desk fixture, with one saved text draft and a snoozed task in a temporary SQLite registry. Verified actual clipboard content contains the selected task, evidence hashes and review notes; top and lower copy buttons both work. Checked database snapshot view, snoozed/completed filters, empty search, anchor navigation then refresh, notes surviving data refresh, and reload with session authentication intact. Desktop preview checked at the default viewport and mobile at 390 × 844; document content width was 390px, with no horizontal overflow. Temporary viewport override was reset.
- Browser testing found and fixed Next.js internal request URL mismatch in local host checks, and an anchor/session-fragment collision on refresh. The initial new API test assumed macOS temporary paths were already canonical; it now compares real paths. Final checks above passed after these corrections.
- A fictional local demo was left open for review. No real product checkout was read or changed, no external action occurred, and no commit, push, or deployment was performed. Existing uncommitted onboarding changes were preserved.

Limits: media/binary references are not visual previews; unlinked draft files are not scanned; notes are page-session state; the local registry/history view is read-only. Vercel build configuration does not make laptop files remotely accessible. A hosted read model or explicit snapshot delivery and hosted authentication are still needed for useful remote deployment, and no Vercel runtime was verified. P07's native host/outside-founder gates remain open independently of P08.

## P09 — competitor research and mention discovery — 2026-09-29

Added user-requested activity `competitor`. `templates/activities/competitor-analysis.md` is the shared procedure for sourced competitor comparisons, verified public mention discovery, duplicate handling, channel/source classification, ranked opportunities and optional reply drafts. The default scope is 3–5 competitors and up to 5–10 verified mentions, starting with the last 30 days for timely engagement; older sources and unverified leads remain distinct. Research does not authorize posting or recurring monitoring and does not treat mentions as buying intent.

The new repo-local `promotion-competitors` Codex skill and `/promote-competitors` Claude Code/OpenCode commands reference the same workflow/activity. Portable onboarding generates all three entrypoints, tracks ownership, preserves customizations and includes the shared activity. WORKFLOW v0.4 routes ordinary competitor requests and lists the new activity; the starter marketing context has optional competitor fields. The task prompt builder adds a competitor-research fallback. Existing string categories, registry and review previews need no schema or UI change.

Verification: `npm run check` passed helper/frontend typechecks, helper build and **63/63 tests**. Two new integration tests verify source and installed links after relocation, customized-entrypoint preservation on upgrade/removal, and a synthetic competitor task through preparation, draft evidence, report preview and prompt handoff without task completion. Skill Creator `quick_validate.py` reported **Skill is valid!** for the new source skill. `npm pack --dry-run --ignore-scripts` with a private temporary cache confirmed the research resource is distributed; the default cache was not writable and was left unchanged. `git diff --check` passed.

No live competitor research, real-product installation, native host menu invocation, external posting, monitoring, commit or push was performed. Research quality remains to be exercised with a selected product and live sources. Existing uncommitted onboarding and Next.js review changes were preserved.

## Try the workflow

In Codex: `$promotion-agent Prepare a directory kit for examples/example-desk. Draft only.`

In Claude Code/OpenCode: `/promote examples/example-desk directory draft only`

Fallback in any current session: `Read templates/WORKFLOW.md and prepare task T-001 for examples/example-desk. Draft only.`

Local helper: `npm run promotion -- prepare --project examples/example-desk --task T-001`

See docs/INTERACTIVE.md for explicit project selection, optional helper configuration and completion usage. Do not mark a submission task done just because its draft was prepared. Source completion requires the actual task criteria, evidence and applicable user authorization.

To onboard one product, first run `npm ci && npm run build`, then `npm run promotion -- onboard --project /path/to/product --name "Product name" --plan /private/tmp/product-install-plan.json`. Review that private plan's file contents and summary before `npm run promotion -- install --project /path/to/product --plan /private/tmp/product-install-plan.json --review-hash <printed-hash>`. No real product repository was onboarded in P04.

## Verified results

On 2026-09-26, Node v22.14.0 / macOS arm64:

- `npm test`: **43/43 pass** — all 38 P01/P02/legacy tests plus 5 new interactive helper/entry-point tests. The 15 superseded subprocess-adapter tests were removed with their implementation.
- Skill Creator `quick_validate.py .agents/skills/promotion-agent`: **Skill is valid**.
- `npm run promotion -- prepare --project examples/example-desk --task T-001`: succeeds and produces task context/prompt without modifying the fixture or starting another agent.
- Verified read-only preparation, old tasks without Prompt, invalid/completed/unknown task rejection, hash conflicts, byte-preserving completion, retained local preferences, wrapper reference resolution, and helper execution with no AI CLI available in PATH.
- `git diff --check`: passes.

On 2026-09-27, Node v22.14.0 / macOS arm64:

- `npm run check`: **50/50 pass**, including 7 P04 integration tests; pinned `typescript@5.9.3` strict typecheck and compiled build pass.
- Preview is read-only; apply preserves existing AGENTS/CLAUDE instructions, facts, tasks, logs and customized commands. Stale plans, target substitution, symlink escapes and traversal fail. Upgrade updates only unmodified managed files; relocation retains the UUID and compiled helpers run without the original checkout or node_modules.
- `npm pack --dry-run --json` with a private temporary npm cache: succeeds, with 32 expected files in the package preview and no source TypeScript or node_modules. The default npm cache produced an `EPERM` ownership error; using a fresh private cache resolved that environment issue.
- `npm pack --pack-destination /private/tmp --json` succeeds. The extracted archive's executable `dist/scripts/promotion.mjs --help` runs with no source checkout or installed dependencies. The installed fictional product's Codex skill passes Skill Creator `quick_validate.py` (`Skill is valid!`).

P05 on 2026-09-27, current Codex desktop session:

- The skill was available in the session catalog and its instructions were followed manually. The agent read only the two selected fictional projects in `examples/p05-lab/`, used `inspect` and `prepare` to verify distinct project IDs and valid task snapshots, and wrote five reviewable draft artifacts.
- Directory T-101 was skipped as a duplicate of fixture Done task T-100. T-102's distinct `.example` destination was inaccessible to the web tool; the draft kit marks fields unknown and leaves both tasks open.
- The social drafts avoid the logged topic-gathering angle; the blog proposal avoids the logged slug/keyword. A [public knowledge-base thread](https://www.reddit.com/r/software/comments/1wal6mh/what_do_you_use_for_a_company_knowledge_base_that/) was retrieved and received a product-free reply draft, with no post. Two other threads were excluded for duplicate/fit reasons. Shift Ledger's separate draft uses only its own volunteer-shift facts.
- `npm run check`: **50/50 tests pass**, including the pinned TypeScript typecheck and build. Skill Creator validation returned `Skill is valid!`. No external submission, scheduling, post, published route, task completion, real product edit, commit or push occurred.
- Native Codex menu selection was not exercised. Claude Code and OpenCode were not active interactive sessions; only their wrapper files and shared workflow links have automated coverage. Do not describe those hosts as live-verified. Cross-host native invocation belongs to P07 release validation.

P06 on 2026-09-27, Node v22.14.0 / macOS arm64:

- `npm run check`: **53/53 tests pass**, including pinned TypeScript typecheck and build. Three new integration tests cover evidence files without a database, draft/stale/changed/foreign evidence rejection, optional skip/snooze/resume and invalid-snapshot behavior, plus the CLI record-to-completion flow. The relocation test now runs `record` from an installed compiled bundle after the original bundle is removed.
- Evidence records bind project ID, task ID, task snapshot hash, outcome, reference and observed time. Local references are hashed; symlink escapes and token-bearing HTTPS URLs with queries/credentials/fragments are rejected. A changed local artifact or record hash blocks completion. The P02 checkbox writer still preserves all unrelated task bytes.
- `Skill Creator quick_validate.py .agents/skills/promotion-agent`: **Skill is valid**. `git diff --check`: passes. No real product was onboarded, no external action was performed, and no evidence file was mistaken for independent proof of an external result.
- The first full test after adding the skip/snooze completion guard found a test that tried to complete a snoozed task. The test now explicitly reactivates it; the rerun passed all 53 tests. The behavior is documented in `docs/INTERACTIVE.md`.

P07 local distribution work on 2026-09-27, macOS 14.5 arm64 / Node v22.14.0 / npm 10.9.2:

- `npm run check`: **55/55 tests pass**, including pinned TypeScript typecheck and build. Two new tests cover reviewed removal, stale-plan rejection, customized wrapper preservation, product-data preservation and reinstall. The first run exposed a mistaken test expectation that the manifest would disappear; product-owned starter files remain tracked, so the corrected test verifies runtime ownership is cleared while product ownership remains.
- `npm pack --pack-destination /private/tmp --json`: succeeds with a 30-file `promotion-agent-0.0.0.tgz`. Package contains compiled runtime, templates, four user-facing docs, README and MIT license; internal handoff/plan/extraction/P05 records and source TypeScript are excluded. `package.json` now declares MIT explicitly. No dependencies were added.
- An offline install of that tarball in a fresh temporary prefix ran the installed binary (not the source checkout) through onboard, install, inspect, removal preview/apply and reinstall for a fictional product. The inspected snapshot was valid; removal deleted 31 unchanged managed files, kept config/tasks, and reinstall recreated the skill. This is an isolated environment on one machine, not a second clean OS or native agent session.
- Official host docs were checked for the repo-local Codex skill, compatible Claude Code command file and OpenCode command file layouts. File layout checks do not prove menu invocation. No Git remote is configured; package remains `private: true`, version `0.0.0`, and no public npm package, push, real-product install, or outside-founder trial was performed. Full release gates and exact steps are in `docs/RELEASE.md`.
- The subsequent repo social-preview task added `assets/opengraph.png` (1280×640, 153 KB) and a README preview. `npm pack --dry-run --json` then passed with 31 files, including the image. The GitHub Settings social-preview upload remains a separate step after a public remote exists.

The P03 verification did not exercise native skill/command menu invocation in all three applications. The current session can always read the workflow directly. Those tests validate deterministic helper behavior, not a model-generated marketing result, live publishing, or host permissions. P03 added no dependency, paid service, commit, push or publication; P04 later added pinned build-only development dependencies.

## Next work

Read the revised docs/PLAN.md and docs/RELEASE.md. P07 local distribution, removal checks, and public source publication are complete, but real native invocation in Codex, Claude Code and OpenCode, an outside founder's first useful draft, broader host/OS acceptance, and npm publication remain open. The P05 Codex artifacts are model-produced fictional drafts, not proof of external publication or cross-host behavior. P06 evidence records document an agent's verified account; the helper does not independently confirm provider actions.

Retain P02 caveats: use one database for shared project locks; stale lock recovery is manual; external editors can race the final check/rename window; recovery after file rename/DB failure is a rescan. SQLite backups contain private local state and do not replace repo-file backups. See docs/STORAGE.md.

Keep the package private until explicit release work. Scope always starts with one explicitly selected product; repository access is not a portfolio-wide import authorization.
