# Local review desk

The optional Next.js App Router app complements the conversational workflow. One running desk (one URL) covers every promotion workspace: a consolidated **All projects** board and a board per product. Each task has a description and one prompt to copy, labeled with where to paste it.

## Start from the source checkout

Ask the current agent to open the review desk. The agent runs the launcher once for all products and opens its printed private session link. The local app runs separately from the portable workspace helpers; registering a product does not install Next.js into either the product or workspace.

Developer commands, run in the promotion-agent checkout:

```sh
npm ci
# Every promotion workspace registered in the registry:
npm run review -- --database /path/to/local.sqlite
# Or an explicit set of workspaces (repeat --project); --database stays optional:
npm run review -- --project /path/to/workspace-a --project /path/to/workspace-b --database /path/to/local.sqlite
```

With only `--database`, the server rereads the registry on every refresh, so a product registered while the desk is running appears after **Refresh**. Only registrations whose checkout has `promotion-source.json` (separate observer workspaces) are shown; a legacy product-local registration is listed as skipped and its checkout is not read. Each `--project` workspace needs promotion-source.json and its existing `promotion-agent.json`, configured context file and task file. A workspace that cannot be read is reported on the consolidated board without hiding the others. The default port is 4317; override with `--port`. To use a production build:

```sh
npm run review:build
npm run review -- --database /path/to/local.sqlite --production
```

Stop the process with Ctrl+C. Restarting preserves task files, evidence and database state. Open the new private session link after restarting; the access token changes each run. The token is kept in browser session storage and removed from the visible URL. It is not a product or provider credential.

Copied prompts include the workspace path and, where relevant, the read-only product repository path.

## Boards

With more than one workspace, buttons at the top switch boards; each shows its open-task count.

- **All projects** (the session link's page) merges every workspace's tasks. Each task carries its product's name; open tasks are ordered by priority, with skipped or snoozed tasks at the bottom.
- **A product's board** (`?project=<project ID>`) shows only that workspace, in task-file order. The address survives a reload and the browser's back button returns to the previous board.

With a single workspace the desk shows its board directly.

## Using the desk

1. Pick a task under **To do**. Skipped or snoozed tasks (from the optional registry) sink to the bottom with a label.
2. Read its description (the task's Materials).
3. Check the **Paste into** label and click **Copy prompt**:
   - **Promotion agent** — paste into your Codex, Claude Code or OpenCode session in the promotion-agent repo. The prompt names the workspace, lists the task steps and any saved drafts, and asks the agent to continue from the first unfinished step, queue follow-up tasks rather than stop at advice, and record its completion summary as Outputs / Impact / Next steps.
   - **Product repo** — shown for tasks with category `product`. Paste into an agent session opened in the product repository. The prompt includes the full description and steps, says where workspace files under `marketing/` live, and asks for no commit, push or deploy without approval.
4. Click **Refresh** after the agent saves work. The server rereads files on every refresh.

### Marking a task yourself

Under the prompt, **Did it yourself, or not doing it?** offers an optional note and two buttons:

- **Mark complete ✓** (asks to confirm) records a `verified-complete` evidence record whose Outputs line is your note marked "marked complete by hand in the review desk", with the task file as its reference, then checks the task's box in the workspace task file. The task moves to **Done** and shows that result.
- **Skip** sets the task's `skipped` disposition in the registry, with your note as the reason (default "Skipped in the review desk."). It stays at the bottom of **To do** with a label; **Resume task** makes it active again. Snoozed tasks are resumed the same way. Resume a skipped or snoozed task before marking it complete.

Both use the same hash-checked helpers as the agent's `record`, `complete` and `disposition` commands. If the task file changed since the desk last loaded, the action is refused; refresh and try again. Marking tasks needs the registry: launch with `--database` (agents should pass the portfolio registry when one exists). Without it the desk explains this and stays read only.

A task whose newest evidence record is a scheduled-post account (see the [post scheduling procedure](../templates/publishing/WORKFLOW.md#bookkeeping)) shows a **scheduled** chip and a note with the adapter, channel, project-local and UTC time and provider reference, and its prompt tells the agent to verify the post. This is read only and is the agent's account, not proof of publication; the desk cannot schedule, change or cancel posts.

Done tasks are listed under **Done** with no prompt. Selecting one shows its result from the newest `verified-complete` evidence record: **Outputs**, **Impact** and **Next steps**, the recorded date and the evidence reference. Summaries recorded before that format show as plain text; a task checked off without a record says so. Copying does not execute or approve anything, complete a task, or write to the registry. The desk shows task text as inert text and does not open referenced draft files; the agent reads them.

Each workspace's state is read by its stable project ID. In registry mode the app lists registered checkout paths and reads only those that are promotion workspaces; product repositories are never read. Reading never creates a missing database; marking a task may create the selected one, as the `disposition` and `complete` helpers do. The only write route is the session-token `POST /api/review` for marking a task complete, skipped or resumed; it accepts a project ID (which must be on the board), a task ID, the loaded task-file revision and a note, never paths. There is no background agent runner or scheduler.

## Next.js and deployment

The root `app/` directory contains React UI and a Node-runtime route at `/api/review`. `src/review/data.ts` owns the local file/SQLite read model (`reviewData` for one workspace, `reviewBoard` for the configured set). `src/review/actions.ts` applies the mark complete/skip/resume actions through the existing helpers. `src/review/prompts.js` builds the one prompt per task and decides its target (`product` category → product repo, otherwise promotion agent). The existing helper build remains `npm run build`; the Next.js build is `npm run review:build`. `vercel.json` selects Next.js and the correct build/output directory.

Local launching binds to 127.0.0.1 and creates a random session token. The API requires that token and rejects mismatched local hosts and cross-origin requests. Project and database paths are server configuration, never browser request parameters. No browser code receives filesystem or database access.

For a separately managed Next.js server, configure these server-only variables:

- `PROMOTION_REVIEW_PROJECTS`: JSON array of absolute promotion workspace paths. An empty array (or unset) means every promotion workspace in the registry. `PROMOTION_REVIEW_PROJECT` (one path) is still accepted when this is unset.
- `PROMOTION_REVIEW_DATABASE`: path to the registry; required when no workspaces are listed.
- `PROMOTION_REVIEW_TOKEN`: a strong random access token, required even outside local mode.
- `PROMOTION_REVIEW_ORIGIN`: exact local origin when binding a local service; leave unset behind a hosted platform proxy.

The app can be built as a standard Next.js project for Vercel. **The current data adapter is local:** a Vercel deployment cannot access the user's laptop or maintain a persistent writable SQLite checkout. Useful hosted deployment therefore requires a separately implemented hosted read model or explicit snapshot delivery, plus an appropriate hosted authentication model. Those are not implemented by the Next.js conversion. No data is uploaded or deployment performed by this workflow.

## Verification

`npm run check` checks helper and frontend types and runs the core/integration suite, including read-only database behavior, task-linked draft references, isolation by project ID, prompt contents and targets, and route authentication. `npm run review:build` validates the optimized Next.js build. Browser acceptance evidence is recorded in `docs/HANDOFF.md`; a build alone does not verify clipboard or visual behavior. Copy falls back to `document.execCommand('copy')` when the Clipboard API is blocked.
