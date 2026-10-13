# Review desk internals

How the optional review desk is built, secured and verified. Its user guide is [REVIEW-UI.md](../REVIEW-UI.md).

## Code layout

The root `app/` directory contains React UI and a Node-runtime route at `/api/review`. `src/review/data.ts` owns the local file/SQLite read model (`reviewData` for one workspace, `reviewBoard` for the configured set). `src/review/actions.ts` applies the mark complete/skip/resume actions through the existing helpers. `src/review/prompts.js` builds the one prompt per task and decides its target (`product` category → product repo, otherwise promotion agent). The existing helper build remains `npm run build`; the Next.js build is `npm run review:build`. `vercel.json` selects Next.js and the correct build/output directory.

## Data access and security

Each workspace's state is read by its stable project ID. In registry mode the app lists registered checkout paths and reads only those that are promotion workspaces; product repositories are never read.

Local launching binds to 127.0.0.1 and creates a random session token. The API requires that token and rejects mismatched local hosts and cross-origin requests. Project and database paths are server configuration, never browser request parameters. No browser code receives filesystem or database access.

The only write route is the session-token `POST /api/review` for marking a task complete, skipped or resumed; it accepts a project ID (which must be on the board), a task ID, the loaded task-file revision and a note, never paths.

## Hosted deployment

The app can be built as a standard Next.js project for Vercel, but the data adapter is local. Useful hosted deployment requires a separately implemented hosted read model or explicit snapshot delivery, plus an appropriate hosted authentication model. Those are not implemented by the Next.js conversion.

## Verification

`npm run check` checks helper and frontend types and runs the core/integration suite, including read-only database behavior, task-linked draft references, isolation by project ID, prompt contents and targets, and route authentication. `npm run review:build` validates the optimized Next.js build. Browser acceptance evidence is recorded in [HANDOFF.md](HANDOFF.md); a build alone does not verify clipboard or visual behavior. Copy falls back to `document.execCommand('copy')` when the Clipboard API is blocked.
