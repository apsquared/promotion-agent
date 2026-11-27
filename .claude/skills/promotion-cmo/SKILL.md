---
name: promotion-cmo
description: Act as CMO across every configured product - review each product's stage, history, skipped and stuck tasks and the available marketing skills, then file a few new, non-duplicate ideas per product as paste-ready tasks for the autopilot runner. Use for "run the CMO review", "come up with new marketing ideas for all my products", "what should we try next" across the portfolio, or the weekly scheduled CMO run.
---

Read [the shared workflow](../../../templates/WORKFLOW.md), then follow [the CMO review](../../../templates/autopilot/CMO.md). Settings, levels and the scheduled-task prompts are in [the autopilot guide](../../../docs/AUTOPILOT.md).

Cover every registered promotion workspace unless the user names one product; resolve a named product with the shared workflow's discovery procedure and never ask for a filesystem path. Run the `autopilot-settings`, `coverage`, `claim --purpose ideation`, `inspect` and `release` helpers from [the local helpers](../../../docs/HELPERS.md) yourself, and release every lease you take, listing the tasks filed with `--filed`. Name the run `<agent>-cmo-<UTC time>-<two random characters>` with your own product name in lowercase (`claude-cmo-…` in Claude Code, `codex-cmo-…` in Codex), and pass `--trigger scheduled` when your scheduler started the session.

The review files tasks and memos in promotion workspaces only. It does not do the tasks, post, send, spend, sign in or change a product repository. Do not launch another AI CLI or delegate.
