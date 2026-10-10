# Observer workspace setup

Set up promotion-agent for one explicitly selected local product. The current agent performs setup; do not give the user a helper-command checklist.

## Select source and workspace

Resolve the product's local repository path from the conversation. Ask only when missing; do not scan sibling repositories. Read its instructions, documentation and any existing marketing history as source material. The product repository stays read only: no runtime, skills, config, task updates, drafts, logs, install locks or databases belong there.

Choose a separate private promotion workspace for this product. Honor an explicit workspace path. Otherwise use a new UUID directory under `~/.local/share/promotion-agent/projects/` and report that choice. Handle directory creation yourself within session permissions. The source and workspace must be non-overlapping canonical directories. Keep private workspaces outside public repositories; never commit source mappings, credentials or customer data. Each product has its own workspace and stable UUID in promotion-agent.json; the local source path lives in promotion-source.json. Reuse the selected workspace for follow-ups and upgrades. A new chat must resolve the workspace explicitly; do not scan all products.

## Preview and install into the workspace

Build the source checkout with Node 22.14+ and `npm run build`; use `npm ci` only if pinned dependencies are missing. Never execute the product's install/build scripts for setup. A compiled bundle uses its existing scripts/promotion.mjs.

1. Run `onboard --project <read-only-source> --workspace <workspace> --name <display-name> --plan <new-private-plan.json>`. The destination directory must already exist. The preview reads the source directory mapping and writes only the external private plan.
2. Read the plan's root, files, before/after contents and preservation decisions. Explain both locations and the files being added to the workspace. Verify the plan and any optional database path are outside the source repository.
3. Setup authorization covers local installation in the separate workspace. Run `install --project <workspace> --plan <plan> --review-hash <returned-hash>`. A preview-only request stops before applying. Handle commands/hashes yourself. Changed before-images require a new preview; never bypass conflict checks.
4. Fill only newly created workspace marketing context with sourced product facts and source-relative document references; mark unknowns. Preserve existing context, tasks and logs. Run the workspace's `inspect` helper and report any task-tracking limits.

Future chats can open the promotion workspace, use its installed skill/command, or read `.promotion-agent/templates/WORKFLOW.md`. The current chat can continue immediately. Native host discovery remains separately unverified. No database, server, publishing account or additional model credential is required.

## Existing product-local installations

Do not remove or upgrade files in a product repository as part of observer setup. Existing product marketing history is read-only input. Offer an explicit copy/import into the separate workspace if requested; preserve provenance and review imported tasks before completion. Do not infer that a copied draft was published. Cleanup of old product-local installations requires a separate request and reviewed file list; invalid imports never authorize deletion.

## Finish

Report the product source, writable workspace, installed/preserved files, supported facts and unresolved gaps. Keep all marketing bookkeeping and recommendations in the workspace. Product code/content edits require a separate explicit request specifying the changes; a request to draft or promote does not authorize them. Continue into a requested activity without an extra permission step.
