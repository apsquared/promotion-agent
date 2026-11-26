# Autopilot runner: work the task queue

The runner claims open tasks across every configured product and does them, one at a time, until its run limit or the queue runs out. Several runner sessions can run at once: each claim is a lease on one product, so two sessions never work the same workspace. It is the second of the two scheduled routines in [the autopilot guide](../../docs/AUTOPILOT.md); [the CMO review](CMO.md) files most of the tasks it works. Use it for "Run the autopilot", "Work the queue" or a scheduled run.

What the runner may do depends on the autopilot level, which every claim returns as `level.allows`. `level.neverAllowed` applies at every level: never post, send, submit or schedule content the user has not approved word for word; never spend money, create accounts, sign in, enter credentials or solve a CAPTCHA; never merge, push a default branch or deploy. When a task needs any of those, the runner prepares everything else and hands the rest to the user as a [handoff packet](#handoff-packets).

## 1. Start the run

Use the portfolio registry at `~/.local/share/promotion-agent/portfolio.sqlite`, or the registry this conversation already uses. Helpers are in [the local helper reference](../../docs/HELPERS.md); in the source checkout run them as `npm run promotion -- <command>`.

Pick a unique agent name for this run, such as `run-2026-11-30T1400Z-k3`. The run limit counts claims per agent name over 24 hours, so never reuse a name from another run.

## 2. Claim a task

```sh
npm run promotion -- claim --database <registry> --agent <name>
```

Add `--project <workspace>` when the user named one product. The helper picks the highest-priority task the level allows, preferring the product with the fewest claims today, and returns:

| Field | Meaning |
|---|---|
| `claim.leaseId`, `claim.expiresAt` | Your lease on this product. Only you work its workspace until you release it or it expires. |
| `claim.mode` and `claim.modeInstructions` | `work`, `handoff`, `verify-post` or `check-condition`, and what to do for it |
| `claim.project` | Name, workspace, read-only product source and timezone |
| `claim.task` | ID, priority, category, title and `revision` (the task file hash for the record and complete helpers) |
| `claim.level` | `allows` and `neverAllowed` for this product |
| `claim.prompt` | The task's full agent prompt with the workspace and source boundaries |
| `runLimit` | Claims used and allowed for this run |

`claim: null` ends the run; report its `reason` and `passedOver` summary. Tasks waiting on the user (a saved draft or a handoff packet), on a `Not before` date, on an unmet `After …` condition, snoozed, skipped, scheduled for later, outside the level, or stuck after two failures in a week are never claimed.

## 3. Do the task

Follow [the shared workflow](../WORKFLOW.md) and the activity guide for the task's category, as in any session, with the claimed task's prompt. Stay inside `level.allows`:

- **Levels 1 and 2:** research, analysis and drafts saved in the workspace. Anything that would leave this machine becomes a handoff packet.
- **Level 3, product tasks:** work in a separate `git worktree` of the product repository outside the user's checkout, on a new branch `promotion/T-NNN-<slug>`. Follow the product's own instructions, run its validation, commit, push that branch and open a draft pull request when the repository has a remote and `gh` is signed in. Never merge, never push the default branch, never deploy. Record the pull request URL as `draft` evidence; merging is the user's step.
- **Level 3, approved external steps:** schedule or submit only content whose exact text, destination and time the user approved in writing, as quoted in the task or its newest record, through the workspace's configured adapter under [post scheduling](../publishing/WORKFLOW.md). With the `manual` adapter, or with no such approval, write a handoff packet.

For work that may outlast the lease (videos, long research), renew it before `expiresAt`:

```sh
npm run promotion -- renew --database <registry> --lease <lease-id> --agent <name>
```

If renewing fails because the lease is not held, stop working on that task at once: another session may have taken it over. Record nothing further for it.

While you hold the lease you may file follow-up tasks in that workspace under [Keep the work moving](../WORKFLOW.md#keep-the-work-moving): at most three, ranked by the buyer test. Run `inspect --project <workspace>` after editing TASKS.md; fix only your own entries if it is not `valid`. If a helper reports that the task file changed, the user edited it meanwhile: inspect again and use the new revision.

## 4. Finish and release

Release every lease with what actually happened. The helper checks the outcome against the workspace, so record first:

| Outcome | When | Record first |
|---|---|---|
| `completed` | Completion criteria met and checked | `record --outcome verified-complete`, then `complete` |
| `draft` | Work saved for the user's review (a draft, a report, a pull request) | `record --outcome draft` with the artifact |
| `handoff` | The rest needs the user | the [handoff packet](#handoff-packets), recorded as `draft` |
| `snoozed` | Cannot start until a date or event | `disposition --state snoozed` with a reason and date |
| `skipped` | Only when the user already said to drop it | `disposition --state skipped` with their reason |
| `failed` | A tool, site or fact blocked the work | nothing; `--note` says what blocked it |

```sh
npm run promotion -- release --database <registry> --lease <lease-id> --agent <name> --outcome draft
```

Do not skip a task on your own judgment. When a task no longer seems worth doing, snooze it for 14 days with the reason starting `Proposed skip:` so the user sees it in the brief and decides. A task that fails or expires twice in a week stops being claimed until someone looks at it.

Then claim the next task. Stop when `claim` returns no claim or the run limit is reached.

## Handoff packets

A handoff packet makes the user's part take as little thought as possible. Write it at `marketing/handoffs/T-NNN.md` in the workspace after doing every part an agent can do:

````markdown
# T-NNN: <title> (<product>)

About <N> minutes. Why now: <one line>.

## Do this

1. Open <exact URL>. Sign in as <account> if asked.
2. In "<field label>", paste:

   ```text
   <exact text>
   ```

3. <next exact step, with the value to choose or the button to press>

## Values

| Field | Value |
|---|---|
| <field> | <exact value> |

## Check before you submit

- <rule, limit or eligibility condition, with where it came from>

## Prefer an agent in your signed-in browser?

```text
Run in: promotion workspace
<self-contained prompt for an agent with browser access: the steps above, the exact text and values, and "stop before submitting and show me the filled form">
```

## When you're done

Paste this into an agent in the promotion workspace:

```text
Run in: promotion workspace
T-NNN (<product>) is done. Live result: <paste the URL>. Check it, record verified-complete evidence, complete the task and queue its follow-ups.
```
````

Keep every link exact and every block copyable on its own. Leave out sections that do not apply. Put drafts the user must approve in the packet word for word, with where they go and when. Then record and release:

```sh
npm run promotion -- record --project <workspace> --task T-NNN --expected-hash <revision> --outcome draft --reference marketing/handoffs/T-NNN.md --summary "Human handoff: <the step in one line>"
npm run promotion -- release --database <registry> --lease <lease-id> --agent <name> --outcome handoff
```

The [daily brief](../brief/WORKFLOW.md) and the review desk show it under "Needs you" as "Handoff ready".

## 5. Report

One screen: the level, then one line per task worked (product, ID, outcome, the artifact or URL), handoffs now waiting on the user with their paths, follow-ups filed, and the main reasons work was passed over. Name failures plainly. End with one offer, such as opening the review desk for the handoffs.
