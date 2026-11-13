# Daily brief

A short, read-only check-in across every configured product: what needs the user, which scheduled posts to check, what the agent can do next, what is coming up and what was recorded since the last check-in. It is for "Give me my daily brief", "What needs me today?", "Check in on my tasks" or "What happened since yesterday?".

The brief reports. It does not queue, complete, snooze, skip, record or post anything, and it does not open product repositories or the web. Those are separate requests the user can make after reading it.

## 1. Choose the scope

- **Every product (default):** use the portfolio registry at `~/.local/share/promotion-agent/portfolio.sqlite` when it exists, or the registry this conversation already used. Run the helper with only `--database`; it reads each registered promotion workspace and skips the rest with a reason.
- **No registry:** find workspaces per "List configured projects" in [the shared workflow](../WORKFLOW.md) and run the helper once per workspace with `--project`.
- **One product:** when the user names one, or the session is opened in a workspace and the user says "this product", run with that workspace's `--project` (add `--database` so snoozed and skipped tasks count).

## 2. Choose the window

Recent activity defaults to the last 24 hours. On a Monday, start from the previous Friday at 00:00 in the user's timezone. If the user says "since Tuesday" or "this week", use that. Pass it as `--since` in UTC.

## 3. Run the helper

```sh
npm run promotion -- brief --database ~/.local/share/promotion-agent/portfolio.sqlite --since 2026-11-12T13:00:00Z
```

In an installed workspace, use `node .promotion-agent/scripts/promotion.mjs brief …` instead. It returns JSON per product:

| Field | Meaning |
|---|---|
| `needsYou` | Open tasks with a `Human required:` step, or whose newest record is a saved draft awaiting review |
| `verifyPosts` | Scheduled posts whose time has passed; each stays open until the live post is checked |
| `ready` | Open, active tasks the agent can work on now |
| `waiting` | Tasks held by a future `Not before` date or an `After …` condition; for a `Follow-up to T-NNN` task the note gives the parent's status |
| `upcomingPosts` | Scheduled posts still in the future |
| `snoozed` | Tasks snoozed in the registry, with the date and reason |
| `recent` | Records saved since `--since`: drafts and `verified-complete` accounts |
| `counts` | Open, done, skipped and stale (no record for 30 days) task counts |

`unavailable` lists workspaces that could not be read, and `warnings` lists unreadable records or task files. Report both; never guess their contents.

## 4. Check before reporting

The buckets come from task text and saved records. Spend a little judgment on them:

- For a `waiting` task whose condition names a parent that is now `done`, say it may be ready and why.
- For a `needsYou` draft, read only the task's title and materials to name the decision in one line ("approve the Thanksgiving drafts"). Do not reopen research.
- A `ready` task that is really the user's step (its prompt asks for sign-in, payment or an approval) belongs under "Needs you".
- `verified-complete` records are the agent's accounts of evidence. Say "recorded as done", not "published" or "live", unless the record names a live URL.

Do not read other files, product repositories or web pages for the brief.

## 5. Report

Keep it to one screen. Lead with one line of totals, then these sections, leaving out any that are empty:

1. **Needs you:** up to five items across products, P1 first. Each line has product, task ID, the decision or step, and why it matters now.
2. **Check scheduled posts:** each post whose time passed, with channel, local time and task ID.
3. **I can do next:** the top three `ready` tasks, P1 first, with one line on what doing it produces.
4. **Coming up:** `Not before` dates and scheduled posts in the next seven days.
5. **Since <day>:** what was recorded, grouped by product, one line each with the outcome (draft or recorded as done).
6. **Quiet:** products with nothing open in one line, plus skipped, snoozed and stale counts when they are not zero.

End with one specific offer: start the top `ready` task, check the due scheduled posts, or open [the review desk](../../docs/REVIEW-UI.md) to work through the "Needs you" list. Starting any of those is a new request under the shared workflow, with its own approvals.

Do not repeat full task prompts or materials in the brief.
