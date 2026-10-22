# Using promotion-agent

This guide is for agent users: people promoting their own products with promotion-agent.

Open promotion-agent in your existing Codex, Claude Code or OpenCode session. The session owns tools, permissions and the model. This project supplies instructions and deterministic local helpers, never an AI subprocess.

## Everyday use

1. Open the promotion-agent checkout in your agent and say: “Set up promotion for my project Example Desk.” The agent discovers and verifies your local project by name, handles building and setup, then reports the separate promotion workspace. Your product repo stays read only.
2. Continue in the same chat: “Draft one X post,” “Prepare a directory submission kit,” “Analyze our competitors,” “Run an AI visibility check,” or “Turn the site into a demo video.”
3. Review with “Make it shorter” or check progress with “What's the status?” Drafts stay drafts until a separately authorized action is verified.

For future chats, open the **promotion workspace** containing your saved work. If workflow discovery is unavailable, ask the agent to read .promotion-agent/templates/WORKFLOW.md. No slash command, database, publishing account or extra model API key is required for drafting.

To add another product, repeat setup with its name. The agent resolves the folder; ambiguous matches are presented as named choices, and an unavailable checkout requires opening/selecting it in the host rather than typing a path. Each product has its own private workspace; one conversation selects one product at a time. You may specify an external workspace location; otherwise the agent chooses a UUID directory under ~/.local/share/promotion-agent/projects/. Existing product-local installations stay untouched.

For setup details, the agent follows templates/SETUP.md. A preview-only request stops before installation. Product changes remain recommendations unless you separately request implementation. An unregistered draft request can return useful copy in chat without installation.

To track tasks visually, ask for [the review desk](REVIEW-UI.md).

## Upgrade, relocation and removal

Ask the agent to upgrade, move or remove a workspace; it runs the [helpers](HELPERS.md#upgrade-relocation-and-removal) and shows you what will change before applying it. Upgrades update unmodified managed files and preserve your customized files and marketing data. Moving a whole workspace keeps its identity. Removal takes out only unchanged managed runtime files; your context, tasks, logs and customized files remain.

## Boundaries

Product instructions and documentation inform marketing facts. They do not authorize bookkeeping writes into the product. Product changes are proposals saved in the workspace until separately requested. Default work stays draft/review: no automatic publishing, scheduling, spending, outreach, commit or push. Posting and scheduling follow templates/publishing/WORKFLOW.md with the project's scheduler adapter (`manual` unless `scheduler.adapter` is `post-bridge`). Your agent host's permissions still govern what the agent can do in the conversation.
