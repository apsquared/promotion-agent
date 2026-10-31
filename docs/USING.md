# Using promotion-agent

This guide is for agent users: people promoting their own products with promotion-agent.

Open your private **promotion workspace** in an existing Codex, Claude Code or OpenCode session for everyday use. The session owns tools, permissions and the model. This project supplies instructions and deterministic local helpers, never an AI subprocess.

There are three separate folders: the **promotion-agent source checkout** contains the software and development instructions; the **promotion workspace** contains your installed workflow and saved marketing work; the **product repository** supplies read-only product facts. A source clone alone is not a configured promotion workspace.

## First-time setup

The current installation uses a source checkout. Clone promotion-agent, open that checkout in your agent and say: “Set up promotion for my project Example Desk.” The agent discovers and verifies your local project by name, handles building and setup, then reports the separate private promotion workspace to open. You do not need to contribute code to use this setup path. The npm package is not published and a public one-command installer is not available yet.

## Everyday use

1. Open the **promotion workspace** reported by setup in your agent. It contains workspace-specific agent instructions and the installed workflow. Your product repo stays read only.
2. Ask: “Draft one X post,” “Prepare a directory submission kit,” “Analyze our competitors,” “Run an AI visibility check,” or “Turn the site into a demo video.” You can also continue immediately in the original setup chat.
3. Review with “Make it shorter” or check progress with “What's the status?” Drafts stay drafts until a separately authorized action is verified.

For future chats, open the **promotion workspace** containing your saved work. If workflow discovery is unavailable, ask the agent to read .promotion-agent/templates/WORKFLOW.md. No slash command, database, publishing account or extra model API key is required for drafting.

To add another product, repeat setup with its name. The agent resolves the folder; ambiguous matches are presented as named choices, and an unavailable checkout requires opening/selecting it in the host rather than typing a path. Each product has its own private workspace; one conversation selects one product at a time. You may specify an external workspace location; otherwise the agent chooses a UUID directory under ~/.local/share/promotion-agent/projects/. Existing product-local installations stay untouched.

For setup details, the agent follows templates/SETUP.md. A preview-only request stops before installation. Product changes remain recommendations unless you separately request implementation. An unregistered draft request can return useful copy in chat without installation.

Keep the source checkout for upgrades and [the review desk](REVIEW-UI.md), whose app is not installed into promotion workspaces. The X growth, Reddit/X search and blog/SEO skills currently remain checkout-only entrypoints; their dedicated skill invocations require that checkout. Installed drafting, revision and status work uses the promotion workspace.

For listings, backlinks or other promotion placements, ask “Find high-quality promotion opportunities for this product” or invoke `$promotion-opportunities` (Codex) or `/promote-opportunities` (Claude Code/OpenCode). The agent verifies site quality, evidence of traffic or SEO value, and the current submission route and product eligibility. It returns only qualified prospects, possibly none, with dated evidence and drafts. Directory kits and saved submission tasks follow the same checks; a past listing or third-party directory entry cannot establish that an opportunity still exists. The agent rechecks before any later authorized action. Existing workspaces receive this skill through a reviewed upgrade.

## Upgrade, relocation and removal

Ask the agent to upgrade, move or remove a workspace; it runs the [helpers](HELPERS.md#upgrade-relocation-and-removal) and shows you what will change before applying it. Upgrades update unmodified managed files and preserve your customized files and marketing data. Moving a whole workspace keeps its identity. Removal takes out only unchanged managed runtime files; your context, tasks, logs and customized files remain.

## Boundaries

Product instructions and documentation inform marketing facts. They do not authorize bookkeeping writes into the product. Product changes are proposals saved in the workspace until separately requested. Default work stays draft/review: no automatic publishing, scheduling, spending, outreach, commit or push. Posting and scheduling follow templates/publishing/WORKFLOW.md with the project's scheduler adapter (`manual` unless `scheduler.adapter` is `post-bridge`). Your agent host's permissions still govern what the agent can do in the conversation.
