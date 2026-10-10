# Persistent plan records

## Location and identity

Reuse an explicitly selected plan directory or the selected promotion workspace's `marketing/x-growth/<account-key>/`. Outside an existing workspace, use a private user-data directory such as `~/.local/share/x-growth/accounts/<UUID>/` when permitted. Generate a UUID once and retain it; do not use a mutable display name as identity. Store the platform user ID if available, handle, profile URL and any verified former handle. A handle alone may later belong to someone else: on ambiguity, confirm identity before reusing records.

Creating a requested plan includes persisting its records when permitted. Respect the session's file-write gates. If persistence is unavailable, provide the same plan in chat and explicitly say it is not saved; do not imply future continuity. Never put account analytics, customer details or real task queues into a shared skill folder, fixtures or source control. In promotion-agent, use its existing workspace and task/evidence rules; do not invent a product registration for a personal account.

Before creating a new directory, check the explicitly selected location or minimal identity metadata under the default account root for an existing match. Do not scan unrelated projects or load other accounts' histories. Keep accounts separate even when one person owns several. If the same X account serves several products, coordinate one account calendar and avoid duplicate bookings; do not merge private product records without selection.

## Small file contract

Use ordinary editable Markdown. Create only files needed by the current work; start with `ACCOUNT.md`, `PLAN.md`, `TASKS.md` and `REVIEWS.md`. Add evidence and drafts as they exist. Return the account directory to the user so a later chat can resume it. These are private plan records, not the helper's project-level task format.

| File | Contents |
|---|---|
| `ACCOUNT.md` | Stable account UUID; platform ID if available; handle and URL; personal/brand; selected workspace/product if applicable; timezone; goal and audience; time budget; voice; constraints; available data sources; last verified date. |
| `PLAN.md` | Version and updated date; baseline/window; primary target; diagnosis and source links; prioritized changes; themes/formats; routine and time math; active experiments; next review date; next action. |
| `TASKS.md` | Stable task ID, plan version, owner, exact deliverable, due date/timezone, estimate, status, draft/opportunity reference, dependency, completion evidence and any rescheduling reason. |
| `REVIEWS.md` | Append dated check-ins: period, actual versus planned work, observations, user feedback, experiment decisions, rationale, plan version change and next action. |
| `evidence/` | Dated audit notes and measurement snapshots with source, capture time, period, definitions, sample size and missing fields. Retain older snapshots. |
| `drafts/` | Stable draft ID and revision; intended account, audience, content theme, exact copy, fact sources, media reference/alt-text if relevant, proposed slot, status and any provider receipt. |

Use `unknown` or `not available` for missing metrics, not zero. Avoid copying private messages or identifiable customer data unless necessary and authorized. Store source references and minimal useful notes instead.

## Updating state

Read the current files before editing; preserve user edits and past decisions. For a task already present, update by its ID, not its title. Do not create a new task merely because it was rescheduled. For repeated activities create a new dated occurrence. Keep a reason for cancellations, deferrals and superseded drafts.

Keep plan-task status separate from post delivery status. A drafting task may be complete when the draft is saved and checked; its post can still be `draft`. A publishing task is incomplete until the action is verified. Unsupported statuses in promotion-agent's own task system must stay in these plan notes or use supported disposition helpers; never bypass its guarded completion flow.

A revision changes the draft revision and invalidates any old content approval for the changed text. Retain receipts for the actual published version; do not rewrite them to match a new draft. Proposed future time, user approval and provider schedule receipt are different facts.

On every substantive review, append the new measurements and decision, increment the plan version if strategy/cadence changes, and reconcile the affected open tasks. Do not erase failed experiments. Confirm the saved content and links are readable before reporting success. If writing fails, state which updates are unsaved.

## Metric definitions

Record numerator, denominator, period and data source for every derived measure. Use comparable time windows and post ages. Separate organic/paid/unknown, originals/replies, account-period totals and lifetime post totals. Do not sum snapshots of cumulative metrics. If a source already combines paid and organic, label it mixed rather than guessing a split.

| Metric | Definition and limitation |
|---|---|
| Net follower change | End follower count minus start count. Gross follows minus unfollows only when both are available for the same period. |
| Follower growth rate | Net change / starting followers × 100; undefined when starting count is zero. |
| Engagement rate | Source-defined engagements / source-defined impressions × 100. Keep included actions consistent. Aggregate using sums of comparable numerators and denominators, not an unweighted mean of percentages. |
| Link click rate | Link clicks / impressions × 100 from the same source/window. A click is not a signup or sale. |
| Follow-to-visit ratio | New follows / profile visits only when both exist for the same window. A descriptive ratio, not attributed profile conversion; follows can happen elsewhere. Net follows are not a substitute for gross follows. |
| Followers per reply | Same-period gross follower gains / replies written; label a descriptive association, never a reply conversion rate or forecast. Report net change separately if gross gains are unavailable. |
| Qualified conversation | Define the desired audience and a substantive exchange before counting. Report sample/coverage; do not invent an audience-quality percentage. |
| Business outcome | Confirmed leads, subscribers or sales from a defined tracking source and attribution window. Keep self-report, tagged-link attribution and causal evidence distinct. |

Zero denominators produce “not defined”; missing denominators produce “not available.” Compare medians and the distribution of comparable posts alongside totals so one viral post cannot silently set the baseline. Explain small samples and confounds before recommending a scale-up.
