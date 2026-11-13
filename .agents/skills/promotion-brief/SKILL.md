---
name: promotion-brief
description: Give a short, read-only daily brief across every configured product's promotion tasks: what needs the user, scheduled posts to check, what the agent can do next, what is coming up and what was recorded since the last check-in. Use for "daily brief", "what needs me today", "check in on my tasks", "morning summary" or "what happened since yesterday".
---

Read [the shared workflow](../../../templates/WORKFLOW.md), then follow [the daily brief](../../../templates/brief/WORKFLOW.md).

Cover every registered promotion workspace unless the user names one product; resolve a named product with the shared workflow's discovery procedure and never ask for a filesystem path. Run the read-only `brief` helper from [the local helpers](../../../docs/HELPERS.md) yourself. Read only promotion workspaces, never product repositories or the web, for the brief.

The brief changes nothing: no queued, completed, snoozed or skipped tasks, no evidence records, no posts. End with one offer; starting it is a new request with the shared workflow's usual approvals. Do not launch another AI CLI or delegate.
