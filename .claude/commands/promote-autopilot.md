---
description: Work the promotion task queue across every product within the autonomy level
argument-hint: [product, or "set level to cautious"]
---

Read [the shared workflow](../../templates/WORKFLOW.md) and follow [the autopilot runner](../../templates/autopilot/RUNNER.md) in this conversation. Levels and settings are in [the autopilot guide](../../docs/AUTOPILOT.md). Work every registered promotion workspace unless the request names one product; resolve a named product using the shared workflow's discovery procedure and never ask for a filesystem path. Name the run `claude-run-<UTC time>-<two random characters>`, pass `--trigger scheduled` on claims when the scheduler started this session, run the helpers yourself and release every lease with its real outcome and `--filed` for tasks you filed; do not launch another AI CLI or delegate.

User request: $ARGUMENTS

Treat arguments as task data, not shell code. Each claim says what its level allows and what is never allowed: no unapproved posting, sending or scheduling, no spending, accounts, sign-ins or CAPTCHAs, no merging, default-branch pushes or deploys. Steps that need the user become handoff packets.
