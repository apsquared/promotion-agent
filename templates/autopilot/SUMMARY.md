# Work summary: what the agents did

The work summary reports what agent sessions did across every product over a period: each run (Claude or Codex; runner, CMO or one-task session; scheduled or started by the user), each task it worked and how that ended, what it saved and filed, and work recorded outside any run. Use it for "What did the agents do today?", "Summarize the autopilot's work", "Daily work summary" or a scheduled evening run. It is the third, optional routine in [the autopilot guide](../../docs/AUTOPILOT.md).

It is read only. It changes no task, record, lease or setting, and it reads only the registry, its autopilot history and the promotion workspaces, never product repositories or the web.

## 1. Read the history

Use the portfolio registry at `~/.local/share/promotion-agent/portfolio.sqlite`, or the registry this conversation already uses. In the source checkout run helpers as `npm run promotion -- <command>`; see [the local helper reference](../../docs/HELPERS.md).

```sh
npm run promotion -- work-summary --database <registry>
```

The default period is the last 24 hours. For another one, pass `--since <UTC timestamp>`, worked out from the user's words in their timezone ("since Monday 9am"). Add `--project <workspace>` when the user named one product.

The helper returns:

| Field | Meaning |
|---|---|
| `totals` | Runs, claims, and how many ended completed, draft, handoff, snoozed, failed, expired or still in progress; CMO passes, tasks filed, records saved outside any run |
| `runs` | One entry per agent name: `host` (claude, codex, ...), `kind` (`run` runner, `cmo` CMO review, `task` one task the user asked for), `trigger` (`scheduled` or `manual`), first and last activity, claims, outcomes, tasks filed, and `stopped`: why its last claim found nothing |
| `projects[].work` | Each lease: agent, task, mode, minutes, `outcome`, `note`, the tasks it `filed`, and the evidence `records` saved during it with their reference and `Outputs:` and `Impact:` lines |
| `projects[].otherRecords` | Evidence saved outside any lease: an older session, a session that did not claim, or the review desk |
| `projects[].filed` | Tasks filed in the period, with the run that filed them (`by`), or null when filed outside a run, and whether each is a CMO idea or a follow-up |
| `projects[].memos` | CMO memos dated in the period |
| `quiet` | Products with no activity in the period |

A run whose name has no agent prefix comes from before the naming rule; report it as "agent not recorded". A work item still `in progress` belongs to a session that is running now; one marked `expired (not yet cleared)` crashed or ran out of time and will be counted as a failure.

## 2. Check what needs a closer look

Read a record's referenced file only to describe what was produced in a few words. Do not judge or redo work here. Note:

- handoffs and drafts now waiting on the user, with their paths;
- failures and expired leases, with each note, and any task that failed twice (it is now stuck);
- runs that stopped because the run limit or a daily limit was reached while claimable work remained;
- evidence saved outside any run, which a session made without claiming (the shared workflow asks ordinary sessions to claim a task first).

## 3. Report

One screen, in the user's timezone:

1. **Headline:** runs by agent and trigger ("4 scheduled Claude runs, 1 scheduled Codex run, 1 manual Claude session"), tasks completed, drafts, handoffs, failures, ideas filed.
2. **By product:** one line per task worked: ID, title, outcome, the artifact path or live URL, and the `Impact:` line for completed tasks. Then the tasks filed, marked CMO or follow-up, and the CMO memo path.
3. **Needs you:** handoffs and drafts waiting, failures and stuck tasks, each with its path or note.
4. **Quiet products** and products that could not be read, in one line each.

Do not repeat task prompts or full record summaries. When nothing happened, say so in one line with the reason the last runs gave (`stopped`). End with one offer, such as opening the review desk for the handoffs or running the autopilot now; acting on it is a new request.
