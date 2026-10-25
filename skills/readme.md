# Useful AI skills

Reusable skills for working on your own projects. Each subfolder is a self-contained skill following the [Agent Skills standard](https://agentskills.io/specification), with `SKILL.md` instructions and any supporting references. Codex UI metadata lives in `agents/openai.yaml`.

These skills are independent of promotion-agent's marketing workflow. They require neither its npm dependencies nor product registration. The promotion-agent installer does not install this collection.

## Available skills

| Skill | Purpose | Example request |
| --- | --- | --- |
| [mcp-ify](mcp-ify/SKILL.md) | Design, implement, or review customer MCP tools for an existing SaaS, including permissions, applicable spending controls, connection UX, and verification. | `Use $mcp-ify to add customer MCP access to this SaaS. Inspect the repo and suggest the first useful workflows.` |
| [product-video](product-video/SKILL.md) | Make a short product tour, launch promo or feature clip from a product's public site, with HyperFrames or a Playwright + ffmpeg fallback, as a reviewable draft MP4. | `Use $product-video to turn https://example.com into a 30-second promo for X.` |
| [nurture-campaign](nurture-campaign/SKILL.md) | Build and verify a short lifecycle email sequence for a product's registered users, with at-most-once delivery, a CAN-SPAM footer, one-click unsubscribe and scheduling. | `Use $nurture-campaign to build a 5-email nurture sequence for users who signed up.` |
| [agent-ready](agent-ready/SKILL.md) | Make a product usable, installable and findable by AI agents: audit live, add a skill, CLI or plugin packaging, discovery assets and directory listings, with MCP work handed to `mcp-ify`. | `Use $agent-ready to audit what agents can do with this product and plan how to get it into the Claude and ChatGPT marketplaces.` |

`mcp-ify` adapts to the project's stack and account model. It includes examples for read-only analytics, paid unlocks, collaboration writes, and existing MCP servers. It does not itself supply an MCP server or deploy one merely by being installed.

`nurture-campaign` inspects the product, its user schema, email setup and Privacy Policy before asking only the decisions that are yours (which existing users to include, the postal address). It dry-runs by default, verifies with tests, a non-existent user and an HTML preview, and tells you how many real users the first run will email before anything is pushed, deployed or sent.

`agent-ready` audits the repo and the live state (MCP endpoint, registry, directory listings, public repo metadata, `llms.txt`) before proposing anything, picks the cheapest surfaces for the gap, and hands MCP server work to `mcp-ify`. It prepares submission packets and names blockers, but never creates accounts, signs in or pays, and asks before each submission, push, deploy, post or repo-metadata change. It includes a dependency-free script that fails on credential-shaped values in files you distribute.

`product-video` runs HyperFrames on demand through `npx` and adds no dependency to your project. It asks before signing in, using paid credits or installing HyperFrames' agent skills globally, shows you the script before building, and never publishes, commits or deploys. It is the standalone version of promotion-agent's `video` activity; its `references/` are kept identical to that activity's.

## Install

With Node.js and npm installed, run this from the project where you want to use the skill:

```sh
npx skills add apsquared/promotion-agent --skill mcp-ify
```

Use the same command with `--skill product-video`, `--skill nurture-campaign` or `--skill agent-ready` for the other skills.

The [skills.sh CLI](https://github.com/vercel-labs/skills#install-a-skill) lets you choose your agent and installation options. Add `--agent codex` to target Codex, or `--global` to make the skill available across your projects.

**Availability:** the GitHub command requires the skill to be pushed to the repository. Until then, install from this checkout instead:

```sh
npx skills add ./skills/mcp-ify --agent codex --global
```

or `./skills/product-video`, `./skills/nurture-campaign` or `./skills/agent-ready`.

Run the local command from the promotion-agent repository root. It installs this local skill for your personal Codex use.

## Use

Open your SaaS project in your agent and ask:

```text
Use $mcp-ify to add customer MCP access to this SaaS.
```

For email, open the product's repository and ask `Use $nurture-campaign to build an email nurture sequence for registered users.`

To make a product agent friendly, open its repository and ask `Use $agent-ready to audit what AI agents can already do with this product.`

For a video, open any folder in your agent and ask `Use $product-video to make a 30-second promo of https://example.com.`

For `mcp-ify` you can also ask for a plan only or a review of an existing MCP server. Use your host's skill selector if it uses a different invocation syntax. If Codex does not show the installed skill, restart it.

## Manual installation

Prefer copying files? Copy the whole skill folder (for example `mcp-ify` or `product-video`), including `references/` and `agents/`, into your project's `.agents/skills/` or your personal `~/.agents/skills/` directory for Codex. Other hosts have their own skill locations. Preserve local customizations when replacing an existing copy.

To remove a manual installation, remove only that installed skill folder. This does not undo product changes made while using the skill.

## Add a skill

Create `skills/<skill-name>/SKILL.md` with YAML `name` and `description` fields; the name must match the folder. Keep the main instructions concise, use relative links for supporting resources, and add a catalog row above. Include scripts only for genuinely reusable execution tasks. Keep secrets, customer records, and machine-specific paths out of distributable files.

Validate metadata, check that references resolve after copying the folder, and review representative scenarios. Report native invocation and real-world behavior separately from structural validation. This collection uses the repository's [MIT license](../LICENSE); preserve its notice when redistributing.
