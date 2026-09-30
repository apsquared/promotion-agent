# Local review desk

The optional Next.js App Router app complements the conversational workflow. It shows one explicitly selected product's current tasks, task-linked drafts and evidence, plus the selected SQLite registry's dispositions, assignments, imported tasks and operational records. The main action is copying a self-contained prompt back into Codex, Claude Code or OpenCode.

## Start from the source checkout

Ask the current agent to open the review desk for your selected product and optional registry. The agent runs the launcher and opens its printed private session link. The local app runs separately from the portable product helpers; installing the workflow into a product does not install Next.js into that product.

Developer commands, run in the promotion-agent checkout:

```sh
npm ci
npm run review -- --project /path/to/selected-product --database /path/to/local.sqlite
```

The database flag is optional. The selected product needs its existing `promotion-agent.json`, configured context file and task file. The default port is 4317; override with `--port`. To use a production build:

```sh
npm run review:build
npm run review -- --project /path/to/selected-product --database /path/to/local.sqlite --production
```

Stop the process with Ctrl+C. Restarting preserves task files, evidence and database state. Open the new private session link after restarting; the access token changes each run. The token is kept in browser session storage and removed from the visible URL. It is not a product or provider credential.

## Review and handoff

1. Filter by task status or activity, or search titles/materials/task IDs.
2. Select a task and read its materials, saved text drafts and evidence accounts. Changed artifacts and task revisions are identified explicitly. Only task-linked evidence appears in the inbox; unlinked files are not discovered by scanning a product.
3. Choose prepare, revise, review/action, or verify. Add review notes and copy the prompt. Completed tasks use verification prompts.
4. Paste it into the active agent. It includes project identity, task-file revision, destination, materials, suggested steps, evidence paths/hashes, policy and notes. The agent rechecks current state and handles applicable authorization.
5. Refresh after the agent saves work. The server rereads files and the database on every refresh.

Copying does not execute or approve anything, complete a task, or write to the registry. Review notes live in the page session; copy them before closing or reloading. Text previews are capped at 256 KiB and displayed as inert text, including HTML. Binary/media artifacts show a reference and integrity status; visual media previews are not implemented. Evidence accounts are labeled separately from independently verified outcomes.

The database/history view includes archived task projections and run/artifact/review/schedule records. It reads only the selected stable project ID and does not follow other registered checkout paths. Current project tasks are authoritative; an outdated database projection is shown separately. A missing database is not created, and invalid task imports never trigger reconciliation or archival. The app has no mutation API, background agent runner or scheduler.

## Next.js and deployment

The root `app/` directory contains React UI and a Node-runtime route at `/api/review`. `src/review/data.ts` owns the local file/SQLite read model. `src/review/prompts.js` holds the browser/test handoff contract. The existing helper build remains `npm run build`; the Next.js build is `npm run review:build`. `vercel.json` selects Next.js and the correct build/output directory.

Local launching binds to 127.0.0.1 and creates a random session token. The API requires that token and rejects mismatched local hosts and cross-origin requests. Project and database paths are server configuration, never browser request parameters. No browser code receives filesystem or database access.

For a separately managed Next.js server, configure these server-only variables:

- `PROMOTION_REVIEW_PROJECT`: absolute path to the one selected product.
- `PROMOTION_REVIEW_DATABASE`: optional path to its existing registry.
- `PROMOTION_REVIEW_TOKEN`: a strong random access token, required even outside local mode.
- `PROMOTION_REVIEW_ORIGIN`: exact local origin when binding a local service; leave unset behind a hosted platform proxy.

The app can be built as a standard Next.js project for Vercel. **The current data adapter is local:** a Vercel deployment cannot access the user's laptop or maintain a persistent writable SQLite checkout. Useful hosted deployment therefore requires a separately implemented hosted read model or explicit snapshot delivery, plus an appropriate hosted authentication model. Those are not implemented by the Next.js conversion. No data is uploaded or deployment performed by this workflow.

## Verification

`npm run check` checks helper and frontend types and runs the core/integration suite, including read-only database behavior, evidence previews, changed/symlinked artifacts, isolation by project ID, prompt contents and route authentication. `npm run review:build` validates the optimized Next.js build. Browser acceptance evidence is recorded in `docs/HANDOFF.md`; a build alone does not verify clipboard or visual behavior.
