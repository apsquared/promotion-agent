# promotion-agent

A marketing assistant for your projects, used through Codex, Claude Code, or OpenCode. It reads your product repository, prepares marketing work, and reviews it with you in conversation.

**Your product repository stays read only by default.** Drafts, research, tasks, and logs live in a separate private promotion workspace. Recommended product changes stay proposals until you ask the agent to apply them.

[Source on GitHub](https://github.com/apsquared/promotion-agent) · [MIT license](LICENSE)

**Early access:** automated helper and build checks run on Ubuntu and macOS. Native invocation across all three agents and an outside user’s first successful draft remain acceptance work. See [release status](docs/maintainers/RELEASE.md).

## Get started

Requires Git, Node.js 22.14 or newer with npm, and Codex, Claude Code, or OpenCode. Install from source; the npm package is not published yet.

### 1. Get promotion-agent

Clone this repository and open its folder in your agent:

```sh
git clone https://github.com/apsquared/promotion-agent.git
```

Keep it separate from your product repositories. The agent handles dependency installation and building when needed.

### 2. Tell it which project to promote

In that chat, say:

```text
Set up promotion for my project Example Desk.
```

The agent finds your local project by name, verifies the match, creates a separate promotion workspace, and tells you where it saved it. If several checkouts match, it asks you to choose; you do not need to supply a filesystem path. The product name can differ from its folder, Git repository or package name; the agent checks identifying project metadata. Nothing is installed into your product repository. Setup keeps work in draft/review mode.

### 3. Ask for marketing work

Continue in the same chat:

```text
Draft one X post for this product.
```

Then review and revise naturally:

```text
Make it shorter and focus on the main benefit.
```

```text
What's the status?
```

For future chats, open the **promotion workspace** the agent created. It contains the workflow and your saved marketing work. If your agent does not discover the workflow, say “Read .promotion-agent/templates/WORKFLOW.md.”

No database, publishing account, or additional model API key is needed for drafting. Scheduling through [Post Bridge](#posting-and-scheduling-with-optional-post-bridge) is optional. Publishing, sending outreach, spending, committing, and pushing require separate authorization.

## What you can ask for

- “Prepare a directory submission kit.”
- “Find relevant discussions and draft helpful replies.”
- “Analyze our competitors and find where people discuss them.”
- “Propose a blog article.”
- “Recommend SEO improvements.”
- “Turn the site into a short demo video.”
- “Schedule this post for Tuesday 9am.”
- “Show me our drafts and pending work.”

This checkout also includes `reddit-thread-search` and `x-post-search` in `.agents/skills/`, with their query reference and search script. Use them to find relevant discussions for the selected product under the shared workflow. These copied skills are currently checkout resources; portable workspace onboarding does not install them.

The agent uses your product documentation and marketing history to support its claims. Drafts and recommendations remain available for review; preparing them does not publish anything.

## X account growth and coaching

Ask “Review @myhandle and create a customized X growth plan,” then “What should I do today?” or “Review this week’s results.” Use `$x-growth` in Codex or `/x-growth` in Claude Code/OpenCode. The shared procedure audits available account evidence, adapts the routine to your time budget, saves tasks and metrics, and revises the plan through ongoing coaching. Personal and brand accounts are supported; personal accounts need no product registration.

These entrypoints are checkout resources; portable onboarding does not install them yet. Account plans and analytics stay in private user data or the selected promotion workspace. Public actions and recurring reminders require applicable explicit authorization. See [X growth workflow](templates/activities/x-growth/WORKFLOW.md) and its [research sources](templates/activities/x-growth/research.md).

## Product videos

Ask “Make a 45-second site tour for X,” or use `$promotion-video` in Codex or `/promote-video` in Claude Code/OpenCode. The agent builds the video project in your promotion workspace under `marketing/assets/videos/`, using [HyperFrames](https://github.com/heygen-com/hyperframes) through `npx` when available and a Playwright + ffmpeg slideshow otherwise. You approve the script before any voice is generated. Signing in to HeyGen, anything that uses paid credits, and installing HyperFrames' agent skills globally stay your decisions. The result is a draft MP4 with a contact sheet; posting it, or copying it into your product repository, is a separate request. See the [video activity](templates/activities/video/WORKFLOW.md).

## Posting and scheduling, with optional Post Bridge

When a draft is approved, ask “Post this” or “Schedule it for Tuesday 9am.” Every project starts with **manual** posting: the agent hands you the exact text, account and time (in your timezone and UTC), and you post it yourself. No tools or accounts are needed.

### Post Bridge (optional)

If you use [Post Bridge](https://www.post-bridge.com), the agent can schedule posts through it for you.

1. Set up Post Bridge's own CLI once, with your key: `npx postbridge-cli setup --key <your key>`. You run this yourself; the agent never asks for, reads or stores your key.
2. Ask the agent: “Use Post Bridge to schedule posts for Example Desk.” It turns Post Bridge on for that product's workspace only, then lists your connected Post Bridge accounts so you can confirm which one to post from.
3. Ask for a post as usual. Before anything is scheduled, the agent shows you the exact text, the account and the time, and waits for your yes.

What to expect:

- **X threads are not supported** by Post Bridge. The agent offers to merge a thread into one post, or to hand you the replies to post yourself, and asks you to approve the changed text.
- **Links are removed from X posts** by Post Bridge. The agent offers to put the link in a reply posted right after the tweet, or to say “link in bio”, and shows you the change first.
- **Scheduled is not published.** The task stays open until the agent has checked the live post after its scheduled time and recorded its URL. The review desk marks it **scheduled** meanwhile.
- Changing or cancelling a scheduled post also needs your approval. The agent never posts immediately unless you ask it to.

Promotion-agent runs no background timer and adds no dependency: Post Bridge holds the scheduled time, and the agent works only while you are in a conversation. Signing up, connecting or reconnecting social accounts, and any paid Post Bridge plan stay in your hands. These steps follow the [post scheduling procedure](templates/publishing/WORKFLOW.md) and its [Post Bridge reference](templates/publishing/post-bridge.md); they have not yet been verified end to end by automated tests.

## Multiple projects

Repeat the setup request with another product's name. Each product gets its own workspace, context, tasks, drafts, and logs. One chat works on one selected product at a time.

Workspaces default to `~/.local/share/promotion-agent/projects/<UUID>/`. You can request a different location outside your product repositories. Keep workspaces private: they contain local paths and product-specific marketing records.

Existing marketing files in a product repo can be read as source material. Earlier product-local promotion-agent installations are left untouched; importing their history or removing their files is a separate request.

## Optional review desk

From a chat in this promotion-agent checkout, ask:

```text
Open the review desk.
```

One local web app covers all your products: a consolidated **All projects** board and a board per product, switched at the top of the page. It lists your tasks. Each task shows its description and one prompt to copy, labeled with where to paste it: your promotion-agent session, or an agent session in the product repository for `product` tasks. With a local registry configured, you can also mark tasks complete, skip them, or resume them. These controls update local task records; they do not publish content or verify external outcomes. See [review desk details](docs/REVIEW-UI.md).

## Reusable AI skills

The standalone [skills collection](skills/readme.md) contains useful skills you can install in your own projects. Start with `mcp-ify` to design, implement, or review customer MCP access for an existing SaaS, or `product-video` to make a short product video from a public website without setting up promotion-agent. The collection includes installation instructions and is separate from promotion-agent onboarding.

## Development and details

```sh
npm ci
npm run check
```

The current agent performs the marketing work. Local helpers manage workspace files and evidence; there is no separate AI runner or background scheduler. Automated helper checks do not establish live native-menu or conversational behavior across all three hosts.

The [documentation index](docs/README.md) defines its two audiences: **agent users**, who use promotion-agent to promote their products, and **agent maintainers**, who develop promotion-agent itself.

For agent users:

- [Using promotion-agent](docs/USING.md) and the [shared workflow](templates/WORKFLOW.md)
- [Review desk](docs/REVIEW-UI.md) and [compatibility](docs/COMPATIBILITY.md)
- [Helper reference](docs/HELPERS.md) (run by your agent)

For agent maintainers:

- [Contributing](CONTRIBUTING.md), [plan](docs/maintainers/PLAN.md) and [handoff](docs/maintainers/HANDOFF.md)
- [Architecture](docs/maintainers/ARCHITECTURE.md) and [release status](docs/maintainers/RELEASE.md)

![Promotion-agent: marketing work inside your agent](assets/opengraph.png)
