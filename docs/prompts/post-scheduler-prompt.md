# Prompt: add a post scheduler with adapters to promotion-agent (manual default, optional Post Bridge)

Paste everything below the line into an agent session opened at the promotion-agent repository root.

---

Add a generic **post scheduler** to promotion-agent: one contract for taking an approved social draft to a scheduled or published post, with pluggable **scheduler adapters**. Ship two adapters:

1. **`manual`** (the default for every project): the agent prepares exact content, account and time, and the user posts it themselves.
2. **`post-bridge`** (optional, opt-in per project): the agent schedules through [Post Bridge](https://post-bridge.com) using the user's own Post Bridge CLI setup.

Read AGENTS.md, README.md, docs/PLAN.md, docs/HANDOFF.md, docs/ARCHITECTURE.md, docs/EXTRACTION.md and templates/WORKFLOW.md first. Follow the repo's existing patterns; the competitor (P09) and video activities are the closest models for procedure layout.

## This is a scope change; record it

The current plan excludes this. docs/PLAN.md lists "app-owned publishing connectors" as out of scope. docs/ARCHITECTURE.md says no publishing connector is introduced, and docs/EXTRACTION.md lists "mandatory Post Bridge" among the legacy problems that were removed. The user has now asked for **optional** Post Bridge support behind a generic scheduler. Add a new P-milestone to PLAN.md that states this change and why. Keep these properties, which are why the earlier exclusion existed:

- **Optional:** no project needs Post Bridge, and `manual` stays the default.
- **No background runner:** promotion-agent never runs a timer, daemon, cron or queue. A scheduled time is held by the provider (Post Bridge) or by the human (manual). The agent only acts inside a user conversation.
- **No stored credentials:** promotion-agent never stores, reads or asks for a provider API key.
- **No new npm dependency.**

Update the out-of-scope line and ARCHITECTURE.md so they describe the new boundary accurately, and leave the EXTRACTION.md history as is.

## Naming

`schemas/contracts.ts` already has legacy `adapterCapabilitiesSchema` and `scheduleSchema` types. They are about AI agent runners and scheduled draft runs, not social posting. Do not reuse or overload them. Use distinct names such as `postScheduler`, `schedulerAdapter` and `scheduledPost` so the two meanings never mix.

## Where it goes

- **Canonical procedure:** `templates/publishing/WORKFLOW.md` holds the generic scheduler contract and lifecycle. Add one reference per adapter beside it: `templates/publishing/manual.md` and `templates/publishing/post-bridge.md`.
- **Route:** in `templates/WORKFLOW.md`, add a request line such as "Post this" / "Schedule it for Tuesday 9am" that points at the publishing procedure. Update "Review and action" and "Tasks and evidence" so scheduling goes through the selected adapter. Bump the contract version.
- **Project configuration:** add an optional scheduler setting per project. The `policy.publish` field (`deny` | `exact-content-review`) already exists, and `reviewBindingSchema` already has `action: 'schedule'`, `accountReference` and `scheduledFor`. Build on those rather than inventing parallel fields. Suggested shape, to be adjusted to the repo's schema conventions:
  - `scheduler.adapter`: `manual` | `post-bridge`, default `manual` when absent. Existing configs without the field must stay valid.
  - `scheduler.accounts`: a per-platform map from a channel (for example `x`) to a provider account reference. This is needed for `post-bridge`. Account IDs live only in the private workspace config, never in fixtures, tests or commits.
  - No credential fields at all.
- **Setup:** templates/SETUP.md keeps `manual` as the default. Mention Post Bridge only as an option the user can turn on later; don't push it during onboarding.
- **Entrypoints:** add none unless the repo pattern requires one. If you add any, they are thin wrappers pointing at the one procedure.
- **Templates and installs:** installed workspaces only receive the new procedure and template changes through a reviewed upgrade.

## The generic scheduler contract (adapter-neutral)

Every adapter implements the same operations, as documented procedure steps the agent follows (see "Implementation shape" below):

| Operation | Meaning |
|---|---|
| `capabilities(platform)` | What the adapter can do on that platform: threads, links in the post body, max length, media, schedule ahead, edit/cancel after scheduling |
| `accounts()` | Which destination accounts are available, confirmed against the provider or the user |
| `fit(draft, capabilities)` | Check the approved draft against the capabilities. Any change needed to fit (merging a thread, removing a link, trimming) is a **content change that voids approval**. Show the exact new text and get approval again before scheduling. |
| `schedule(content, account, time)` | Requires explicit approval of the exact content, account and time. Returns a provider reference (Post Bridge post ID) or a handoff (manual). |
| `status(reference)` | One of: drafted, approved, scheduled, published, failed, cancelled, uncertain |
| `update` / `cancel` | Only before publishing, and each needs its own approval |
| `verify(reference)` | Confirm the live post and its public URL from a provider result or a user-supplied URL that you check. Only then is it published. |

Lifecycle rules for every adapter:

- **"Scheduled" is not "published."** The task stays open until `verify` succeeds.
- **No "post now" unless the user explicitly says so.** Approval of one post never carries over to another post, a changed caption or a new time.
- **Times:** the user speaks in the project timezone. Convert to UTC explicitly and state both in the approval request (for example "Tue 2026-10-13 9:00 America/New_York = 13:00 UTC").
- **Logging:** append to the workspace `marketing/logs/post-log.md` at scheduling time using its existing format (scheduled date, platform, category, provider reference, full text), marked scheduled and unverified. Update or append when verified. Save `record` evidence as `draft` while scheduled. Save `verified-complete` only with the live URL, then use `complete`.
- **Duplicates:** before scheduling, check the post log and the provider's scheduled list for the same text, task or time, and refuse to double-schedule.
- **Follow-ups:** after a post is scheduled, queue its verification as the next action under "Keep the work moving". Do not create an app-side timer.

## Adapter: manual (default)

This formalizes what the workflow already does:

- **`capabilities`** is whatever the platform itself supports (threads and links allowed on X).
- **`schedule`** produces a handoff: the exact text per post (numbered if it's a thread), any assets with verified paths, the account, the time in local and UTC, and the platform's own scheduling steps if the user wants to use them. Nothing external happens.
- **`verify`**: the user supplies the live URL; the agent opens it, checks the text matches, then records it.
- It needs no tools, accounts or network access, and works the same in Codex, Claude Code and OpenCode.

## Adapter: post-bridge (optional)

Encode these facts, learned from Post Bridge's published agent skill ([github.com/post-bridge-hq/agent-mode](https://github.com/post-bridge-hq/agent-mode), API reference at [api.post-bridge.com/reference](https://api.post-bridge.com/reference)) and from a real Idea Launch run on 2026-10-12. Recheck them against the current docs while implementing, and date them in the reference.

**Access:**
- **How to call it:** use the published CLI through `npx postbridge-cli <command>` (Node 18+). It is fetched on demand and is not a promotion-agent dependency. The raw REST API (`https://api.post-bridge.com`, Bearer token) is the documented alternative.
- **Credentials belong to the user's Post Bridge setup.** The CLI reads `POST_BRIDGE_API_KEY`, then `./.post-bridge/config.json`, then `~/.config/post-bridge/config.json`.
- **If the key is missing,** the user runs `npx postbridge-cli setup --key <their key>` themselves; the agent stops and waits. Never search env files, keychains or config files for keys, never print them, and never pass one on the command line on the user's behalf.
- **When to touch Post Bridge at all:** only when the project's adapter is `post-bridge`, or the user asks to use it in the conversation. Never probe it otherwise.

**Commands:**

| Command | Use |
|---|---|
| `accounts` | Lists connected accounts with `id`, `platform` (`twitter` for X), `username`, `needs_reconnect`, `has_x_premium` |
| `post --caption "..." --accounts <id> --schedule <ISO-8601 UTC>` | Schedule a post |
| `post ... --draft` | Create a Post Bridge draft |
| `post ... --use-queue` | Post to the user's queue slots |
| `posts:get --id <id>` | Status: `processing`, `scheduled`, `posted`, `failed` |
| `results --post-id <id>` | Per-platform success or failure, with errors |
| `posts:update` / `posts:delete` | Only work on scheduled or draft posts |

**Using the commands:**
- **Account reference:** confirm the configured account with `accounts` before scheduling, and refuse an account whose `needs_reconnect` is true.
- **Instant posts:** posting without `--schedule`, `--draft` or `--use-queue` publishes **immediately**. Use it only when the user explicitly asks to post now.
- **Verify after the time:** check `posts:get` and `results`. Neither guarantees a public URL. Confirm the live post before `verified-complete`.

**Platform gotchas** (these become `capabilities` and `fit` rules):
- **No X threads.** A post is a single caption; there is no way to chain replies. A thread must be merged into one post, or the user posts the replies manually, or it goes through the manual adapter. Merging changes the content and needs re-approval.
- **Long X posts:** a single X post can exceed 280 characters only when `has_x_premium` is true. Otherwise enforce 280, with a link counted as 23.
- **Links are stripped from X captions.** Post Bridge removes `http://`, `https://` and `www.` links before posting to X. Move the link to a reply (manual) or "Link in bio", say so in the approval request, and treat confirming the bio link as an open check. Bare domains such as `example.io` were not tested; verify on the live post rather than assuming.
- **Media** must be Post Bridge `media_id`s from `upload` (or direct public URLs through the MCP `media_urls`), never a share-page link. Very large videos can silently drop X, YouTube and LinkedIn results; check `results` for every targeted platform.
- **Each platform posts independently;** one failure doesn't stop the others.
- **Optional MCP:** Post Bridge also offers an MCP server (`https://mcp.post-bridge.com/mcp`) with equivalent tools. Treat it as an equivalent access route when the session has it; don't require it.

What the 2026-10-12 run showed: an approved four-post X thread had to become one long post (thread unsupported), and its link became "Link in bio" (links stripped). Both changes needed fresh approval. The account was matched from a hint in old product logs, then confirmed with `accounts`. The post was logged as scheduled with its provider ID, and the task stayed open pending verification. The procedure should make each of those steps explicit rather than leaving them for the agent to discover.

## Implementation shape

Keep provider calls out of promotion-agent's own code for this milestone. The agent runs `npx postbridge-cli` (or the MCP tools) in its session under the user's host permissions, following `templates/publishing/post-bridge.md`, just as it already uses browser and media tools. Deterministic code is limited to:

- the config schema and validation (`manual` default, adapter enum, account map, no credentials)
- any small helper for scheduled-post bookkeeping, if one is needed to keep the log entry, evidence `draft` record and provider reference consistent; reuse `record` and `complete` where they suffice
- optionally, review-desk display: when a task's latest evidence says scheduled, show the adapter and the local time, read only. No scheduling or cancelling from the browser.

If you conclude a code-level adapter interface is needed, explain why in HANDOFF.md before adding it, and keep it free of network calls in tests.

## Hard boundaries (restate these in the procedure)

- **Approval:** scheduling, posting, updating and cancelling are external actions. Each needs explicit approval of the exact content, account and time in the conversation. A task, a skill invocation, a review-desk click or an elapsed time is never approval.
- **No spending or account creation.** If Post Bridge needs a paid plan, an account or a reconnect, stop and hand that step to the user.
- **Content rules still apply:** product claims guardrails, no spend or cost-per figures, the channel voice and product-mention ratio from `marketing/AGENT.md`.
- **Workspace only:** the product repo stays read only, and all logs and records live in the promotion workspace.

## Acceptance

- `npm run check` passes: typechecks, helper build, all tests.
- New tests cover:
  - a config without a scheduler resolves to `manual`; an unknown adapter is rejected; a credential-looking field is rejected
  - the publishing route in WORKFLOW.md and both adapter references resolving from source and installed workspaces (mirror the existing entrypoint and procedure ownership tests)
  - the scheduled-post bookkeeping path: a `social` task recorded as scheduled stays open and shows on the review desk; `complete` still requires `verified-complete` evidence
  - no test touches the network or Post Bridge
- The package dry-run includes the new `templates/publishing/` files.
- Docs state plainly what deterministic tests do not verify: Post Bridge itself, its CLI behavior, account connection, link stripping, and actual publication.
- Update PLAN status and HANDOFF with evidence. Make no commits unless asked.
