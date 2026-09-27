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
- **P07 local distribution complete; release gates open:** the private tarball installs offline into a temporary prefix and its binary onboards, removes and reinstalls a fictional project. Reviewed removal keeps product data/customized wrappers; MIT package metadata and a reduced release bundle are in place. Native host menu invocation, an outside-founder trial, other OS/version checks and public publication remain unverified. See `docs/RELEASE.md`.

Removed the superseded P03 subprocess/protocol adapter files, CLI smoke script, synthetic CLI test fixture and obsolete probe evidence. The earlier CLI failures were not repaired; they are no longer prerequisites for this design. No global skills were installed, no other product repo was modified, and no model login or external account change was made.

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

Read the revised docs/PLAN.md and docs/RELEASE.md. P07 local distribution and removal checks are complete, but real native invocation in Codex, Claude Code and OpenCode, a broader supported host/OS matrix, an outside founder's first useful draft, public source provenance and publication remain open. The P05 Codex artifacts are model-produced fictional drafts, not proof of external publication or cross-host behavior. P06 evidence records document an agent's verified account; the helper does not independently confirm provider actions.

Retain P02 caveats: use one database for shared project locks; stale lock recovery is manual; external editors can race the final check/rename window; recovery after file rename/DB failure is a rescan. SQLite backups contain private local state and do not replace repo-file backups. See docs/STORAGE.md.

Keep the package private until explicit release work. Scope always starts with one explicitly selected product; repository access is not a portfolio-wide import authorization.
