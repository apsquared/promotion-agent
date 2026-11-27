---
name: promotion-autopilot
description: Work the promotion task queue across every configured product - claim one task at a time under a lease so several sessions can run at once, do it within the autonomy level set for that product, turn any step that needs the user into a handoff packet with exact links, values and copy-ready prompts, and release with the real outcome. Use for "run the autopilot", "work the queue", "set the autopilot to cautious/aggressive", or the scheduled runner.
---

Read [the shared workflow](../../../templates/WORKFLOW.md), then follow [the autopilot runner](../../../templates/autopilot/RUNNER.md). Levels, settings and the scheduled-task prompts are in [the autopilot guide](../../../docs/AUTOPILOT.md).

Work every registered promotion workspace unless the user names one product; resolve a named product with the shared workflow's discovery procedure and never ask for a filesystem path. Name each run `<agent>-run-<UTC time>-<two random characters>` with your own product name in lowercase (`claude-run-…` in Claude Code, `codex-run-…` in Codex), and pass `--trigger scheduled` on claims when your scheduler started the session. Run the `claim`, `renew`, `record`, `complete`, `disposition`, `inspect` and `release` helpers from [the local helpers](../../../docs/HELPERS.md) yourself, and release every lease with what actually happened, listing tasks you filed with `--filed`.

Each claim returns what its level allows and what is never allowed; follow both. For "make it more or less aggressive" requests, change the level or limits with the `autopilot-settings` helper and report the new settings. Do not launch another AI CLI or delegate.
