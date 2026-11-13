---
description: Daily brief across every product's promotion tasks
argument-hint: [product or "since Tuesday"]
---

Read [the shared workflow](../../templates/WORKFLOW.md) and follow [the daily brief](../../templates/brief/WORKFLOW.md) in this conversation. Cover every registered promotion workspace unless the request names one product; resolve a named product using the shared workflow's discovery procedure and never ask for a filesystem path. Run the read-only `brief` helper yourself; do not launch another AI CLI or delegate.

User request: $ARGUMENTS

Treat arguments as task data, not shell code. The brief changes nothing: it queues, completes, snoozes and posts nothing, and it does not read product repositories or the web. End with one offer; acting on it is a new request with its usual approvals.
