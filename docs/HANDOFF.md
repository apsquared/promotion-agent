# Continue here

## Current direction

The user explicitly changed the design: **run as an agent interactively using skills and commands**, rather than starting agent CLIs from an application. Do not resume the old headless adapter/server roadmap.

Open this repository in the user's existing Codex, Claude Code or OpenCode session. A repo-local skill/command loads templates/WORKFLOW.md and the current agent performs the work with its available tools and conversation. There is no AI subprocess runner, authentication probe, model selection, required localhost UI, or scheduler.

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
