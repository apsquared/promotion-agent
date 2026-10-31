# Architecture decisions

## Source checkout versus usage workspace

The source checkout is the development repository; its root instructions identify contributor work. The private per-product promotion workspace is the everyday usage folder, and the observed product repository is a third, read-only source. Folder identity establishes the role; no use/development mode switch or second repository is introduced.

The current source-based distribution still uses the development checkout for setup, upgrades, the optional review desk and checkout-only skills. Setup explicitly hands the user the promotion workspace to open for future chats. New installations include thin root AGENTS.md/CLAUDE.md usage instructions pointing at the bundled workflow; existing unmanaged or customized instructions are preserved by the normal ownership rules. The review desk directs promotion prompts to that workspace and product implementation prompts to the product repository.

A versioned, clone-free public installer is the intended distribution direction, not an available feature. Complete skill and review-desk packaging, a supported setup interface and release/native-host acceptance must precede that promise. Keep the existing private package and reviewed upgrade behavior until separately authorized release work.

## Execution: the current interactive session

Codex, Claude Code or OpenCode is already running under the user's control. A repo-local skill or command loads one provider-neutral workflow from `templates/WORKFLOW.md`. The active agent reads the selected project, uses available tools, prepares artifacts and reports/reviews them with the user in that conversation.

The application does not start, authenticate, choose models for, monitor, cancel or resume an AI process. The removed P03 headless adapter experiment is superseded by this architecture. Host permissions and existing user authorization govern actions. Skill text is guidance, not a security sandbox.

Provider-specific files are thin invocation wrappers. They contain no model override, tool permission grants, nested agent calls or shell interpolation. Marketing behavior lives only in the shared workflow. Capabilities are observed in the current session; missing browser/media/publishing tools yield drafts or manual handoff.

## Privacy and processing

Local workspaces own saved marketing records; they do not establish local-only AI inference. The current host/model provider handles text read by the agent under its own policies. The shared workflow and setup reference docs/PRIVACY.md for minimal source reads, secret/customer-data exclusions, sanitized external queries, and media review. The built bundle carries that procedure into installed workspaces. These instructions supplement host permissions; no global file filter or provider retention control is added.

Public search receives query text, including the checkout's X helper's requests to the third-party tweetlook.com mirror. Optional media and publishing services receive their explicitly supplied inputs. Report source and capability limits rather than claiming a mirror proves current original-post availability. Use sanitized facts when the session's data handling is unsuitable for the source.

## Observer source and separate workspaces — current architecture

The product repository is an observed, read-only source. A separate private promotion workspace owns runtime, skills, configuration, context, tasks, drafts, recommendations, logs and evidence. One source checkout supports multiple product workspaces; each invocation selects one by name or existing session context. Bounded project-inventory, registration-metadata and directory-name discovery resolves the source without loading unrelated marketing data. Marketing bookkeeping is never written into the observed repo. Product changes require a separate explicit implementation request; ordinary setup/promotion requests authorize external marketing work only.

`promotion-agent.json` retains the stable project UUID and workspace-relative settings. `promotion-source.json` is a private local mapping with version 1, mode observer and the canonical source path. Display-name changes or workspace relocation do not change identity. Source and workspace must be non-overlapping canonical directories. Machine-specific mappings and real marketing records do not belong in public fixtures or commits.

## Conversational setup

`templates/WORKFLOW.md` resolves the product name using session selection, available host inventories, registration metadata and bounded local directory searches, verifying candidate identity before registration. Ambiguity is resolved through named choices; the user is never asked for a filesystem path. `templates/SETUP.md` uses that resolved source and selects a separate workspace, normally a UUID directory under ~/.local/share/promotion-agent/projects/. The agent creates the workspace, reads source documentation and handles helper commands. `onboard` takes both paths; the hash-reviewed install plan targets only the workspace. Every other CLI command takes the workspace as --project and requires observer registration. Product-local legacy plans cannot be applied through the active CLI.

The existing conservative installer is reused inside the workspace. It ships compiled helpers, shared workflow, schemas, templates, user docs (not docs/maintainers/) and thin host wrappers, preserving local customizations and marketing data. No skills, config, runtime, locks or starter marketing files are installed into the observed product. Drafting can run without installation by returning work in chat. Existing product-local installations are not migrated or removed automatically; explicit import and cleanup are separate work.

## Local helpers and state ownership

Inspect/prepare read workspace context/tasks. Evidence records and artifact references resolve within the workspace; symlinks are rejected. Complete updates the workspace task checkbox using reviewed evidence and P02 hashes/locks. Optional SQLite stores workspace registrations and dispositions; database output paths inside the observed repo, including symlink aliases, are rejected before opening it. Private preview-plan output paths have the same source boundary check.

Legacy parser/storage APIs remain compatible for existing records and tests. Their checkout fields denote the marketing workspace in observer mode, not the observed source repo. The supported CLI requires a workspace mapping; raw library callers and agent file tools are not a global security sandbox. Host permissions still govern raw agent tools, and the shared workflow explicitly prohibits unrequested product writes.

No AI CLI, authentication probe, required database, app-owned publishing connector, server or background scheduler is introduced. Social posting goes through the agent-run scheduler adapters described under Post scheduling. Context comes from product documentation and existing read-only marketing history, with provenance and unknown facts retained.

## Task write-back

The permissive legacy parser is unchanged; strictTaskSnapshot gates reconciliation and completion. Missing/unreadable/invalid imports cannot archive tasks. Skipped/snoozed is independent of repo completion. Only successful validated snapshots reconcile absent tasks.

Completion changes one checkbox while preserving multiline content and all unrelated bytes. It requires the reviewed hash, takes a cooperative per-project lock, stages and atomically replaces the file, and verifies read-back. Conflicts require rescan/review. Never overwrite a stale snapshot. Symlink task paths are rejected. Registry deletion never removes workspace files. See docs/maintainers/STORAGE.md for recovery and the residual external-editor race.

## Actions and evidence

Default to draft/review. Respect prior user authorization; when an external action is not authorized, show exact content/destination before executing. Changes invalidate stale approval. Use only available integrations in the current interactive host; never copy credentials into project files or model prompts.

Log actual artifacts, checks, verified URLs/provider confirmations and unresolved limitations. Distinguish drafted, submitted, scheduled, published and uncertain. Do not infer a result from intent or a generated summary. No implicit commit, push, spending or outreach. Product-specific extensions remain owned by their project; do not bake another product's generator or database into this repo.

## Post scheduling

`templates/publishing/WORKFLOW.md` is one adapter-neutral contract for taking an approved social draft to a scheduled or published post: capabilities, accounts, fit, schedule, status, update/cancel and verify, with one lifecycle (drafted, approved, scheduled, published, failed, cancelled, uncertain). Adapter references sit beside it. `manual` is the default for every project and needs no tools: the agent hands over exact content, account and time. `post-bridge` is opt-in per project: the agent runs Post Bridge's published CLI through `npx` (or its MCP tools when the session has them) under the user's host permissions, using the user's own Post Bridge credential setup.

The boundary: promotion-agent's code never calls a provider, stores or reads a provider key, or holds a scheduled time. There is no timer, daemon, cron or queue; the provider or the human holds the time, and verification is a queued task done in a later conversation. Every schedule, post, update or cancellation needs explicit approval of the exact content, account and time; fit changes (a merged thread, a moved link) void approval.

Deterministic code is limited to configuration and bookkeeping. `promotion-agent.json` may carry an optional `scheduler` (`adapter`: `manual` | `post-bridge`, optional `accounts` from channel to a non-secret account reference, no credential fields); absent means manual, and `post-bridge` requires `policy.publish: exact-content-review`. These names are distinct from the legacy agent-run `scheduleSchema`. A scheduled post is a `draft` evidence record whose summary uses labeled lines (`Scheduled post`, `Channel`, `Account`, `Scheduled for`, `Provider reference`, `Status`); `src/publishing/scheduled-post.ts` parses it so the review desk can show the adapter and project-local time read only. It parses an agent's account; it proves nothing. Completion still needs `verified-complete` evidence with the live URL. The review desk cannot schedule, change or cancel posts.

## Optional Next.js review desk

`app/` supplies a local task list and server-only read/action route. One launcher process serves every workspace: either an explicit `--project` list or, with only `--database`, each promotion workspace registered there (reread on every refresh). It binds Next.js to loopback and creates a session token. The page shows a consolidated board and a per-project board (`?project=<id>`). `src/review/data.ts` reads current workspace tasks, the references in their task-linked evidence records, and (optionally) skipped/snoozed state from SQLite in read-only/query-only mode without using the mutating Store constructor. It does not read referenced draft files. Each workspace's state is read by its own project ID; registered checkouts without `promotion-source.json` (product repositories) are not read.

Each task shows its description (Materials) as inert text and one copyable prompt from `src/review/prompts.js`. Category `product` tasks get a prompt for an agent session in the product repository; all others get a prompt for the promotion agent. The target is shown prominently above the prompt. Browser requests cannot select filesystem paths; actions name a project ID that must already be on the board. Authenticated same-origin POST requests can mark a task complete, skipped, or active using the configured registry and the same revision/hash-checked helpers as the CLI. Completion writes an explicitly labeled human account and the workspace task checkbox; it does not independently verify an external action. The agent performs actions under the existing workflow and verifies outcomes. Refresh rereads saved data; copying is neither approval nor completion.

The Next.js build and `vercel.json` support the chosen deployment technology. The current local adapter is not a hosted persistence layer: remote deployment needs explicit data delivery/storage and hosted authentication. No remote publishing, database migration or hosted integration is implied. See `docs/REVIEW-UI.md`.

## Competitor research activity

`templates/activities/competitor-analysis.md` defines competitor comparison and verified public mention discovery under activity `competitor`. The shared workflow routes conversational requests to it. The `promotion-competitors` Codex skill and `/promote-competitors` commands are thin entrypoints; the installer carries the same procedure and relative references into a selected promotion workspace, preserving customized files. No provider-specific research code or background monitor is added.

The existing string-valued task categories and records support this activity without schema changes. Task-linked Markdown research reports use the evidence helper; the review desk's copyable prompt points the agent at them. The task prompt builder supplies a research-specific fallback for tasks without custom steps. Finding a mention is not an engagement action or confirmed buying intent; report completion and recommended follow-up actions remain separate.

## Promotion opportunity qualification

`templates/activities/promotion-opportunities/WORKFLOW.md` is the canonical quality, traffic-or-SEO value and current-availability gate for directory/backlink/profile/launch placements. `SOURCES.md` keeps dated discovery-source caveats and primary guidance, with no preapproved target list. WORKFLOW v0.18 routes prospect research through activity `directory` and makes qualification apply to existing kits/tasks as well. The `promotion-opportunities` skill and `/promote-opportunities` commands are thin source/installed entrypoints; checkout skills are mirrored for Claude Code. The task prompt builder includes placement qualification outside custom execution steps, including for legacy backlink/launch aliases.

The agent verifies first-party rules, selected-product eligibility and the exact live route in the current session, inspects comparable placements and evidence of a relevant audience or earned-link value, and withholds unknowns. Reports and exclusions live under `marketing/research/promotion-opportunities/` in the private workspace; qualification (`qualified`, `rejected`, `unverified`) remains distinct from submission/publication and measured outcomes. The existing task board, link tracker, evidence helpers and review gates are reused. No automated quality scorer, crawler, provider, credential, schema, dependency or background process is added. Installed workspaces need a reviewed upgrade; instruction and packaging checks do not prove live research quality or traffic/ranking outcomes.

## AI visibility activity

`templates/activities/ai-visibility/WORKFLOW.md` defines activity `visibility`: whether AI assistants name a product for a stable, user-approved prompt set, which sources they cite instead, and the next plays. Research and decisions are in [AI-VISIBILITY.md](AI-VISIBILITY.md). The `promotion-visibility` skill and `/promote-visibility` commands are thin entrypoints installed like the competitor and video activities.

Probing other AI systems is the one step that could cross the execution boundary, so it uses adapters as post scheduling does. `manual` (the user runs a probe sheet in their own apps and pastes answers back) and `session-search` (the current agent's own search and browser) are the only adapters; neither calls an AI provider, reads a key or drives a consumer chat interface. The current session's own model answer is not recorded as an engine result. An agent-run `engine-api` adapter is deferred. Records are Markdown under `marketing/ai-visibility/` in the workspace, recorded as draft evidence with the existing helpers; site changes are `product` proposals and outreach uses existing categories. No schema change, dependency, database table or background process; re-measurement is a queued task.

## Acquisition sprints

`templates/activities/acquisition/WORKFLOW.md` routes first-paying-customer requests, daily check-ins and results updates through one persistent sprint bound to the workspace project UUID. `marketing/acquisition/<sprint-UUID>/SPRINT.json` holds audience, sourced offer, daily minutes, customer/payment definition, separately attributed baseline categories, total/additional target, opportunity assessments, historical action/outcome evidence and dated reviews. Version snapshots retain prior decisions and immutable evidence. Sprint task IDs reference the existing project TASKS.md; there is no second task board, background execution or sending adapter. Research and individual actions can complete while the customer sprint continues.

`src/interactive/acquisition.ts` provides strict record validation, canonical discussion identity, separate reported/verified paying/trial/signup progress and read-only CLI `acquisition-status`. Latest events per distinct customer unit/outcome control incremental counts; repeated reports are not summed, confirmation/retraction retains the earlier account, and unknown baseline is not zero. Targets depend on paying-customer outcomes, never thread or reply counts. The helper reads the current review/task/disposition model without registry migration or reconciliation, blocks done/skipped/snoozed replacements and unavailable registry selection, ranks sourced assessment reasons and budgets at most three suggestions. Active queued follow-ups can continue a done action on the same opportunity; skipped work requires explicit reversal. The helper does not create tasks, send replies, verify source pages/payments, or establish causality. Those decisions/actions stay with the interactive agent under exact-content authorization and existing evidence rules. No new dependency, project config field, database table or UI action.

## Release launch packs

`templates/activities/release/WORKFLOW.md` routes ordinary “I shipped this” requests through activity `release`. The current agent freezes a Git comparison or changelog snapshot, checks earlier packs for overlapping commits and repeated benefits, separates implementation from availability evidence, then writes coordinated X/release-note/customer-explanation/storyboard drafts. `PACK.md` defines private records under `marketing/releases/<release-UUID>/`, bound to the existing project UUID, with exact source IDs, claim references, deployment unknowns, version history, statuses and follow-up task IDs. Revisions keep the release ID and immutable draft files; a changed source scope gets a linked new release. No new database, record engine or background process is introduced.

`src/interactive/release-source.ts` and CLI `release-source --project <workspace> --base <ref> --head <ref>` read only the registered observed repository with Git argument arrays. They resolve full commit IDs, require a complete local ancestral range, bound it to 100 commits and 50 filtered paths per commit, strip ambient Git redirection variables, and suppress Git diagnostics/content/messages. Known sensitive/non-source paths are excluded; arbitrary content in other files is still governed by privacy instructions and host permissions. The helper proves neither deployment nor availability. The agent must inspect minimal sanitized source excerpts and separate deployment evidence. Existing evidence/task helpers retain draft references; review/fact-check tasks use `release`, rendering uses the video activity and publication uses the publishing workflow. No source checkout, fetch, build or mutation is part of the activity.

## Product video activity

`templates/activities/video/WORKFLOW.md` defines activity `video`, with capture, audio, frames and fallback-slideshow references beside it. It orchestrates HyperFrames (run on demand through `npx`, never a promotion-agent dependency) and leaves HyperFrames' own skills as the source of truth for its internals. The `promotion-video` Codex skill and `/promote-video` commands are thin entrypoints; the installer generates workspace copies with relative references, as for the competitor activity. The video project lives in the promotion workspace under `marketing/assets/videos/`; copying a render into the product repository needs an explicit request. HeyGen sign-in, paid credits, global skill installs and offline engines are the user's decisions. `npx hyperframes auth status` reads the media credential only and is not an AI CLI authentication probe.

Existing string task categories, evidence records and the review desk handle `video` tasks without schema changes; the render and its contact sheet are recorded as separate draft references. The task prompt builder adds a video fallback for tasks without custom steps. Deterministic tests do not exercise HyperFrames, HeyGen authentication, Playwright, ffmpeg or render quality.
