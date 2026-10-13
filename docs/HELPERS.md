# Local helper reference

For the agent working in a user's session. It runs these helpers itself; users never need to type them. The user-facing guide is [USING.md](USING.md).

## Commands

Run helpers yourself. Node 22.14+ is required. Build the source checkout with npm run build; installed workspaces use node .promotion-agent/scripts/promotion.mjs without dependencies or the original checkout.

```sh
npm run promotion -- onboard --project /read-only/product --workspace /private/promotion/workspace --name "Product" --plan /private/tmp/new-plan.json
npm run promotion -- install --project /private/promotion/workspace --plan /private/tmp/new-plan.json --review-hash REVIEWED_HASH
npm run promotion -- inspect --project /private/promotion/workspace
npm run promotion -- prepare --project /private/promotion/workspace --task T-001
```

Both directories must exist before preview. `onboard` uses the product only to resolve its canonical mapping; the agent reads documentation separately. Every other command's `--project` selects the **workspace**, never the source repo. The CLI requires an observer registration and rejects legacy product-local installation plans. Inspect/prepare read context/tasks in the workspace. promotion-agent.json retains a stable UUID; promotion-source.json stores the private machine-specific source path. Installation plans are private, hash-reviewed and checked against unchanged before-images.

## Evidence, state and completion

For a first-customers sprint, follow [the acquisition activity](../templates/activities/acquisition/WORKFLOW.md). Save the stable project/sprint UUIDs, customer definition, separate baseline/outcome categories, target, ranked opportunity history and dated reviews under `marketing/acquisition/<sprint-UUID>/SPRINT.json`, with immutable version snapshots for evidence. `acquisition-status --project <workspace> --sprint <UUID> [--database <selected-registry>]` reads that record and the existing board, validates canonical opportunity identity and computes reported versus verified progress without verifying payments. It suggests at most three actions fitting daily minutes, respects done/skipped/snoozed state and withholds suggestions if a requested registry is unavailable. It never queues or sends; TASKS.md remains the only executable task board. Pass the existing registry when one is configured. “What should I do today?” and results updates resume this record; report completion never establishes ten customers.

For “Prepare a launch pack for what I shipped since last Friday”, follow [the release activity](../templates/activities/release/WORKFLOW.md). Resolve absolute dates in the project timezone, then freeze a specific comparison with `release-source --project <workspace> --base <local-ref-or-commit> --head <local-ref-or-commit>`. The read-only helper uses Git argument arrays and returns exact IDs plus bounded, filtered file names; it never returns the full diff or proves deployment. Save its snapshot and the claim table with coordinated draft versions under `marketing/releases/<release-UUID>/`. For changelog sources, retain the document hash/section and record any unavailable commit IDs as unresolved. Check prior packs before announcing changes again. Pack review/fact checks use `release` tasks; renders and approved posts use the existing video and publishing workflows.

`record --project <workspace> --task <id> --expected-hash <task-hash> --outcome draft --reference marketing/drafts/example.md --summary <text>` saves immutable evidence in the workspace, without SQLite. Artifact references must be contained regular workspace files, with symlinks rejected. A scheduled post is a `draft` record whose reference is the approved text file and whose summary uses the scheduled-post lines from templates/publishing/WORKFLOW.md (`Scheduled post:`, `Channel:`, `Account:`, `Scheduled for:` in UTC, `Provider reference:`, `Status:`); the review desk shows it as scheduled and the task stays open.

`state` and `disposition` use an optional private SQLite registry. Use one registry per portfolio for shared locks; the registered checkout path is the workspace. Database destinations inside the observed repo, including symlink aliases, are rejected. Snoozing requires a reason and future UTC timestamp.

After independently verifying actual completion, record `verified-complete` with a summary of `Outputs:`, `Impact:` and `Next steps:` lines (the review desk shows it for done tasks; see templates/WORKFLOW.md), review the returned evidence path/hash, then use `complete --project <workspace> --task <id> --expected-hash <task-hash> --database <external.sqlite> --evidence <record-path> --evidence-hash <record-hash>`. Completion changes only the workspace task checkbox; it never changes the product's task files. A record is an agent-supplied evidence account, not independent proof of publication. Drafts stay open until their actual task criteria are met.

## Upgrade, relocation and removal

Re-preview onboarding from a newer bundle with the same source and workspace, then apply the reviewed hash. Unmodified managed files update; customized files and workspace-owned marketing data are preserved. Move the entire workspace to relocate it without changing its UUID; optional database registration relocation remains explicit. Moving the source requires reviewing and updating its local mapping separately; the helper refuses a changed canonical mapping or inaccessible source.

`remove-preview --project <workspace> --plan <private-plan>` and `remove --project <workspace> --plan <plan> --review-hash <hash>` remove unchanged managed runtime/entrypoints only. Context, tasks, logs, source mapping and customized files remain. There is no automatic product-local migration, archival or deletion.

## Boundaries

The [user boundaries](USING.md#boundaries) apply. Helpers never call a scheduling provider or hold a scheduled time. Raw agent file tools remain governed by host permissions and the shared workflow; helper checks are not a sandbox for the entire conversation.
