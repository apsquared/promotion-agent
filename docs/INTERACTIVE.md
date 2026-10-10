# Interactive use

Open promotion-agent in your existing Codex, Claude Code or OpenCode session. The session owns tools, permissions and the model. This project supplies instructions and deterministic local helpers, never an AI subprocess.

## Everyday use

1. Open the promotion-agent checkout in your agent and say: “Set up promotion for my project at /absolute/path/to/my-project.” The agent handles building and setup, then reports the separate promotion workspace. Your product repo stays read only.
2. Continue in the same chat: “Draft one X post,” “Prepare a directory submission kit,” or “Analyze our competitors.”
3. Review with “Make it shorter” or check progress with “What's the status?” Drafts stay drafts until a separately authorized action is verified.

For future chats, open the **promotion workspace** containing your saved work. If workflow discovery is unavailable, ask the agent to read .promotion-agent/templates/WORKFLOW.md. No slash command, database, publishing account or extra model API key is required for drafting.

To add another product, repeat setup with its local path. Each product has its own private workspace; one conversation selects one product at a time. You may specify an external workspace location; otherwise the agent chooses a UUID directory under ~/.local/share/promotion-agent/projects/. Existing product-local installations stay untouched.

For setup details, the agent follows templates/SETUP.md. A preview-only request stops before installation. Product changes remain recommendations unless you separately request implementation. An unregistered draft request can return useful copy in chat without installation.

## Helper reference for agents

Run helpers yourself. Node 22.14+ is required. Build the source checkout with npm run build; installed workspaces use node .promotion-agent/scripts/promotion.mjs without dependencies or the original checkout.

```sh
npm run promotion -- onboard --project /read-only/product --workspace /private/promotion/workspace --name "Product" --plan /private/tmp/new-plan.json
npm run promotion -- install --project /private/promotion/workspace --plan /private/tmp/new-plan.json --review-hash REVIEWED_HASH
npm run promotion -- inspect --project /private/promotion/workspace
npm run promotion -- prepare --project /private/promotion/workspace --task T-001
```

Both directories must exist before preview. `onboard` uses the product only to resolve its canonical mapping; the agent reads documentation separately. Every other command's `--project` selects the **workspace**, never the source repo. The CLI requires an observer registration and rejects legacy product-local installation plans. Inspect/prepare read context/tasks in the workspace. promotion-agent.json retains a stable UUID; promotion-source.json stores the private machine-specific source path. Installation plans are private, hash-reviewed and checked against unchanged before-images.

## Evidence, state and completion

`record --project <workspace> --task <id> --expected-hash <task-hash> --outcome draft --reference marketing/drafts/example.md --summary <text>` saves immutable evidence in the workspace, without SQLite. Artifact references must be contained regular workspace files, with symlinks rejected.

`state` and `disposition` use an optional private SQLite registry. Use one registry per portfolio for shared locks; the registered checkout path is the workspace. Database destinations inside the observed repo, including symlink aliases, are rejected. Snoozing requires a reason and future UTC timestamp.

After independently verifying actual completion, record `verified-complete`, review the returned evidence path/hash, then use `complete --project <workspace> --task <id> --expected-hash <task-hash> --database <external.sqlite> --evidence <record-path> --evidence-hash <record-hash>`. Completion changes only the workspace task checkbox; it never changes the product's task files. A record is an agent-supplied evidence account, not independent proof of publication. Drafts stay open until their actual task criteria are met.

## Upgrade, relocation and removal

Re-preview onboarding from a newer bundle with the same source and workspace, then apply the reviewed hash. Unmodified managed files update; customized files and workspace-owned marketing data are preserved. Move the entire workspace to relocate it without changing its UUID; optional database registration relocation remains explicit. Moving the source requires reviewing and updating its local mapping separately; the helper refuses a changed canonical mapping or inaccessible source.

`remove-preview --project <workspace> --plan <private-plan>` and `remove --project <workspace> --plan <plan> --review-hash <hash>` remove unchanged managed runtime/entrypoints only. Context, tasks, logs, source mapping and customized files remain. There is no automatic product-local migration, archival or deletion.

## Boundaries

Product instructions and documentation inform marketing facts. They do not authorize bookkeeping writes into the product. Product changes are proposals saved in the workspace until separately requested. Default work stays draft/review: no automatic publishing, scheduling, spending, outreach, commit or push. Raw agent file tools remain governed by host permissions and the shared workflow; helper checks are not a sandbox for the entire conversation.

Internal legacy storage/parser APIs remain for compatibility tests and explicit future migration work. Their historical checkout fields refer to the marketing workspace in observer mode; they are not the supported product-local setup route.
