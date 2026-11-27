---
name: promotion-brief
description: Give a short, read-only daily brief across every configured product's promotion tasks: what needs the user, scheduled posts to check, what the agent can do next, what is coming up and what was recorded since the last check-in. Also gives the read-only work summary of what agent sessions did: every Claude or Codex run, scheduled or manual, each task worked with its outcome, tasks filed and work waiting on the user. Use for "daily brief", "what needs me today", "check in on my tasks", "morning summary", "what happened since yesterday", "what did the agents do today" or "daily work summary".
---

Read [the shared workflow](../../../templates/WORKFLOW.md), then follow [the daily brief](../../../templates/brief/WORKFLOW.md). For what the agents did ("what did the agents do today?", "work summary", the scheduled evening summary), follow [the work summary](../../../templates/autopilot/SUMMARY.md) with the read-only `work-summary` helper instead.

Cover every registered promotion workspace unless the user names one product; resolve a named product with the shared workflow's discovery procedure and never ask for a filesystem path. Run the read-only `brief` or `work-summary` helper from [the local helpers](../../../docs/HELPERS.md) yourself. Read only promotion workspaces, never product repositories or the web, for either one.

The brief changes nothing: no queued, completed, snoozed or skipped tasks, no evidence records, no posts. End with one offer; starting it is a new request with the shared workflow's usual approvals. Do not launch another AI CLI or delegate.
