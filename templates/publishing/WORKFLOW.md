# Post scheduling

Use this procedure under the [shared workflow](../WORKFLOW.md) to take an approved social draft to a scheduled or published post. It is one contract for every scheduler adapter: the agent follows the same operations and lifecycle, and the selected adapter decides how each operation is carried out.

| Adapter | When | Reference |
|---|---|---|
| `manual` | Default for every project | [Manual adapter](manual.md): the agent prepares exact content, account and time; the user posts it |
| `post-bridge` | Optional; the user turns it on per project | [Post Bridge adapter](post-bridge.md): the agent schedules through the user's own Post Bridge CLI setup |

## Select the adapter

Read `scheduler` in the selected workspace's `promotion-agent.json`. Absent means `manual`.

```json
"scheduler": { "adapter": "post-bridge", "accounts": { "x": "12345" } }
```

- `adapter`: `manual` or `post-bridge`.
- `accounts` (optional): channel → provider account reference, where the channel is one of `x`, `linkedin`, `instagram`, `facebook`, `threads`, `bluesky`, `tiktok`, `youtube`, `pinterest`. For `post-bridge` this is the Post Bridge account ID; for `manual` it may be a handle. Account IDs live only in this private workspace config, never in fixtures, tests or commits.
- `post-bridge` also requires `policy.publish` to be `exact-content-review`; the helpers reject the configuration otherwise. `policy.publish: deny` keeps the agent to manual handoffs.
- There are no credential fields. Promotion-agent never stores, reads or asks for a provider API key.

Change `scheduler` only when the user asks. To turn on Post Bridge for a product, set `scheduler.adapter` to `post-bridge` and `policy.publish` to `exact-content-review` in that workspace's `promotion-agent.json`, run the adapter's `accounts()` step, and add the confirmed account IDs to `scheduler.accounts`. To turn it off, set the adapter back to `manual`. Turning on Post Bridge is the user's decision; mention it as an option when a manual handoff is repetitive, but never push it. A user can also ask to use Post Bridge for one post in the conversation; that does not change the project setting. Never probe Post Bridge for a project whose adapter is `manual` unless the user asks to use it.

## Hard boundaries

- **Approval.** Scheduling, posting, updating and cancelling are external actions. Each needs explicit approval, in this conversation, of the exact content, account and time. A task, a skill invocation, a review-desk click, a saved draft or an elapsed time is never approval. Approval of one post never carries over to another post, a changed caption, a different account or a new time.
- **No "post now"** unless the user explicitly says so for this post.
- **No background runner.** Promotion-agent never runs a timer, daemon, cron or queue. The scheduled time is held by the provider (Post Bridge) or by the user (manual). The agent acts only inside a user conversation; checking a post later is a queued task, not an app-side timer.
- **Credentials, accounts and spending.** Never search env files, keychains or config files for keys, never print a key and never pass one on the command line for the user. If a provider needs a key, a paid plan, a new account or a reconnect, stop and hand that step to the user.
- **Content rules still apply.** Product claims come from `marketing/AGENT.md` guardrails and approved drafts; no spend or cost-per figures; keep the channel voice and the product-mention ratio from `marketing/AGENT.md`.
- **Workspace only.** The product repository stays read only. Drafts, the post log and evidence records live in the promotion workspace.

## Operations

Every adapter implements these operations as procedure steps. The adapter references say how.

| Operation | Meaning |
|---|---|
| `capabilities(platform)` | What the adapter can do on that platform: threads, links in the post body, maximum length, media, scheduling ahead, editing or cancelling after scheduling |
| `accounts()` | Which destination accounts are available, confirmed against the provider or the user |
| `fit(draft, capabilities)` | Check the approved draft against the capabilities. Any change needed to fit (merging a thread, moving a link, trimming) is a content change that voids approval: show the exact new text and get approval again before scheduling |
| `schedule(content, account, time)` | Requires explicit approval of the exact content, account and time. Returns a provider reference (Post Bridge post ID) or a handoff (manual) |
| `status(reference)` | One of `drafted`, `approved`, `scheduled`, `published`, `failed`, `cancelled`, `uncertain` |
| `update` / `cancel` | Only before publishing, each with its own approval of the exact change |
| `verify(reference)` | Confirm the live post and its public URL from a provider result, or from a user-supplied URL that you open and check. Only then is it `published` |

## Lifecycle

1. **Drafted.** The social draft is saved in the workspace (for example `marketing/drafts/<date>-<slug>.md`) with its source facts. Saving it schedules nothing.
2. **Fit.** Read the adapter's capabilities for the target platform and check the draft. If it must change, write the fitted text to the draft file, show the exact new text, say what changed and why, and ask again. The earlier approval no longer applies.
3. **Duplicates.** Before scheduling, check `marketing/logs/post-log.md`, the task's evidence records and, for a provider adapter, the provider's scheduled list for the same text, task or time. Refuse to schedule a duplicate; report the existing entry instead.
4. **Approval request.** Show, in one message:
   - the exact text of every post (numbered if it is a thread), plus any first comment or reply, and any media with its verified workspace path;
   - the adapter, platform and account (handle and reference);
   - the time in the project timezone and in UTC, for example `Tue 2026-10-13 9:00 America/New_York = 13:00 UTC`;
   - every fit change and open check (for example "the link moves to a reply; confirm it appears").

   The user speaks in the project timezone (`timezone` in `promotion-agent.json`). Convert to UTC explicitly. A time in the past, or "now", is a post-now request and needs the user to say so.
5. **Approved → scheduled.** Run the adapter's `schedule` step with exactly the approved content, account and time. Read back the result (provider ID and status, or the handoff). If the result differs from what was approved, stop and report it.
6. **Record.** Do the bookkeeping below at scheduling time.
7. **Scheduled ≠ published.** The task stays open. Queue verification as the next action (see below).
8. **Verify.** After the scheduled time, run the adapter's `verify` step. Only a confirmed live post with a public URL is `published`. A provider status alone, a "posted" flag without a URL, or the user's "done" without a URL you checked is `uncertain`.
9. **Close.** Record `verified-complete` evidence with the live URL, complete the task, and queue what the post unlocks.

`failed`: report the provider's error, keep the task open and offer a fix; a retry is a new approval. `cancelled`: record it and leave the task open or skip it with the user's reason.

## Bookkeeping

**Post log.** At scheduling time, append to `marketing/logs/post-log.md` in its existing format, using the scheduled date (project timezone) and the scheduler channel as the platform (older entries may use `ig` and `fb`). Keep the entry on one line; write thread posts and line breaks as ` / `. Put the adapter, provider reference and state in the provider field:

```text
- 2026-10-13 | x | tip | post-bridge:98765 [scheduled, unverified] | Full post text
- 2026-10-14 | linkedin | lesson | manual [scheduled, unverified] | Full post text
```

When verified, change that entry's marker to `[published https://…]`, or `[failed: reason]`, `[cancelled]` or `[uncertain: reason]`. If the entry is missing, append one.

**Evidence while scheduled.** If the post belongs to a task, record `draft` evidence with the `record` helper. The reference is the workspace file holding the exact approved text (its hash binds the content; do not edit that file afterwards, write a new revision instead). Use this summary shape; the review desk reads it to show the task as scheduled:

```text
Scheduled post: post-bridge
Channel: x
Account: <account reference>
Scheduled for: 2026-10-13T13:00:00Z
Provider reference: <Post Bridge post ID, or "manual handoff">
Status: scheduled, unverified
```

Record a new `draft` record with the same shape when the state changes before publication (`Status: cancelled`, `Status: failed, <reason>`, a new time after an approved update).

**Evidence when published.** Record `verified-complete` evidence only with the live public URL as the reference and the Outputs / Impact / Next steps summary from the shared workflow, then use `complete`. A scheduled record cannot complete a task.

## Keep the work moving

After a post is scheduled, its verification is the next action. The open task holds it: say when to check ("after Tue 2026-10-13 9:00 America/New_York") and verify when the user next asks for status or work on this product. If the post was scheduled without a task, file one under the shared workflow's [Keep the work moving](../WORKFLOW.md#keep-the-work-moving), for example "Verify the scheduled X post", with `Not before <date>` and the provider reference in Materials. Do not create an app-side timer, cron job or provider-side monitor.

## Report

State the adapter, the exact content scheduled or handed off, account, local and UTC time, provider reference, log entry, evidence record, the task that stays open and what remains unverified.
