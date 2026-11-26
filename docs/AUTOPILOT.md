# Autopilot: two scheduled routines for every product

Instead of one scheduled task per product, set up two for the whole portfolio:

1. **CMO review** (weekly): looks at every configured product, its stage, what worked, what you turned down and which skills are available, and files a few new, non-duplicate ideas per product as ready-to-run tasks. It follows [the CMO review](../templates/autopilot/CMO.md).
2. **Autopilot runner** (every few hours): claims open tasks across every product and does them within the autonomy level you set. Anything that needs you becomes a handoff packet with exact links, values and copy-ready text. It follows [the autopilot runner](../templates/autopilot/RUNNER.md).

Both run as ordinary sessions in your agent, from the promotion-agent source checkout, and use the portfolio registry at `~/.local/share/promotion-agent/portfolio.sqlite`. Promotion-agent runs no timer of its own: your agent's scheduler starts the sessions.

## Set them up

Create two scheduled tasks in your agent (in Claude, Scheduled or Routines; in Codex, Automations), each running in the promotion-agent source checkout. Paste these prompts.

CMO review, weekly (for example Monday 8:00):

```text
Run in: promotion-agent source checkout
Run the weekly CMO review with the promotion-cmo skill (/promote-cmo in Claude Code, $promotion-cmo in Codex). Cover every product registered in ~/.local/share/promotion-agent/portfolio.sqlite. Follow templates/autopilot/CMO.md: claim one product at a time with --purpose ideation, learn from completed, skipped and stuck tasks, list at least six candidates including one activity not tried recently, and file at most the per-product idea budget as paste-ready tasks tagged "CMO idea <today>". File tasks and memos only: do not do the tasks, post, send, spend, sign in or change any product repository. Release every lease. End with the portfolio summary.
```

Autopilot runner, every two hours during your working day (for example 9:00–19:00):

```text
Run in: promotion-agent source checkout
Work the promotion task queue with the promotion-autopilot skill (/promote-autopilot in Claude Code, $promotion-autopilot in Codex), using the registry ~/.local/share/promotion-agent/portfolio.sqlite. Follow templates/autopilot/RUNNER.md: use a new unique agent name for this run, claim one task at a time, stay within the level each claim returns and its neverAllowed rules, turn any step that needs me into a handoff packet under marketing/handoffs/, record evidence, release every lease with its real outcome, and stop at the run limit or when nothing is claimable. End with a one-screen report.
```

Several runner tasks can be scheduled at the same time (for example three copies at the same hour): each claims a different product. You can also start either one by hand: "Run the CMO review", "Run the autopilot", or "Work the queue for TVFoodMaps only".

Once both are running, the per-product scheduled tasks you had are no longer needed.

## Set how aggressive it is

Ask in any session, for example "Set the autopilot to cautious", "Let it be aggressive on Idea Launch" or "Stop the autopilot". The agent changes the settings with the `autopilot-settings` helper. Settings live beside the registry in `portfolio.sqlite.autopilot/settings.json`; each product can override the portfolio level.

| Level | The runner may | Per run | Per product per day | CMO ideas per product |
|---|---|---|---|---|
| 0 off | nothing | 0 | 0 | 0 |
| 1 cautious | research, analysis and drafts for P1–P2 tasks, no product, video or release tasks; handoff packets | 2 | 1 | 2 |
| 2 standard (default) | everything cautious does for P1–P3 tasks of every category except product; checks scheduled posts that are due and follow-ups whose parent is done | 5 | 3 | 3 |
| 3 aggressive | everything, including product tasks on a new branch with a draft pull request, and posting or submitting content you already approved word for word through your configured scheduler | 10 | 6 | 5 |

Any of the numbers can be changed on its own, for the portfolio or one product: run limit, daily claims per product, highest priority taken, ideas per product and the open-task cap (above it, the CMO files nothing for that product until the queue shrinks).

At every level it never posts, sends, submits or schedules anything you have not approved word for word; never spends money, creates accounts, signs in, enters credentials or solves a CAPTCHA; and never merges, pushes a default branch or deploys.

## What lands on your plate

Each task that needs you gets a handoff packet at `marketing/handoffs/T-NNN.md` in its workspace: how long it takes, numbered steps with exact links, text to paste in copyable blocks, a table of field values, things to check before submitting, a prompt you can give an agent in your signed-in browser instead, and a prompt to paste back when you are done so the agent records it and queues what comes next.

The [daily brief](../templates/brief/WORKFLOW.md) lists them under "Needs you" as "Handoff ready", and the [review desk](REVIEW-UI.md) shows them with each task. Drafts waiting for your approval show the same way. The runner does not claim a task again while its draft or handoff waits on you.

## When something goes wrong

- A task that fails or whose lease expires twice in a week stops being claimed; the CMO memo and the coverage report list it as stuck.
- A lease expires after two hours by default (three at aggressive), so a crashed session frees its product automatically.
- When the runner thinks a task is no longer worth doing, it snoozes it for 14 days with a reason starting "Proposed skip:"; skipping stays your decision.
- Set the level to 0 to stop everything; scheduled sessions then end immediately with "Autopilot is off".
