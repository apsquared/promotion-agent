# Useful AI skills

Reusable skills for working on your own projects. Each subfolder is a self-contained skill following the [Agent Skills standard](https://agentskills.io/specification), with `SKILL.md` instructions and any supporting references. Codex UI metadata lives in `agents/openai.yaml`.

These skills are independent of promotion-agent's marketing workflow. They require neither its npm dependencies nor product registration. The promotion-agent installer does not install this collection.

## Available skills

| Skill | Purpose | Example request |
| --- | --- | --- |
| [mcp-ify](mcp-ify/SKILL.md) | Design, implement, or review customer MCP tools for an existing SaaS, including permissions, applicable spending controls, connection UX, and verification. | `Use $mcp-ify to add customer MCP access to this SaaS. Inspect the repo and suggest the first useful workflows.` |

`mcp-ify` adapts to the project's stack and account model. It includes examples for read-only analytics, paid unlocks, collaboration writes, and existing MCP servers. It does not itself supply an MCP server or deploy one merely by being installed.

## Install

With Node.js and npm installed, run this from the project where you want to use the skill:

```sh
npx skills add apsquared/promotion-agent --skill mcp-ify
```

The [skills.sh CLI](https://github.com/vercel-labs/skills#install-a-skill) lets you choose your agent and installation options. Add `--agent codex` to target Codex, or `--global` to make the skill available across your projects.

**Availability:** the GitHub command requires the skill to be pushed to the repository. Until then, install from this checkout instead:

```sh
npx skills add ./skills/mcp-ify --agent codex --global
```

Run the local command from the promotion-agent repository root. It installs this local skill for your personal Codex use.

## Use

Open your SaaS project in your agent and ask:

```text
Use $mcp-ify to add customer MCP access to this SaaS.
```

You can also ask for a plan only or a review of an existing MCP server. Use your host's skill selector if it uses a different invocation syntax. If Codex does not show the installed skill, restart it.

## Manual installation

Prefer copying files? Copy the whole `mcp-ify` folder, including `references/` and `agents/`, into your project's `.agents/skills/` or your personal `~/.agents/skills/` directory for Codex. Other hosts have their own skill locations. Preserve local customizations when replacing an existing copy.

To remove a manual installation, remove only its installed `mcp-ify` folder. This does not undo product changes made while using the skill.

## Add a skill

Create `skills/<skill-name>/SKILL.md` with YAML `name` and `description` fields; the name must match the folder. Keep the main instructions concise, use relative links for supporting resources, and add a catalog row above. Include scripts only for genuinely reusable execution tasks. Keep secrets, customer records, and machine-specific paths out of distributable files.

Validate metadata, check that references resolve after copying the folder, and review representative scenarios. Report native invocation and real-world behavior separately from structural validation. This collection uses the repository's [MIT license](../LICENSE); preserve its notice when redistributing.
