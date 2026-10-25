# Surfaces: skill, CLI, MCP

## Two kinds of agents

| | Personal agents | Remote agents |
| --- | --- | --- |
| Examples | Claude Code, Codex, OpenClaw, Hermes, Cursor | ChatGPT, Claude on the web |
| Runs | On the user's machine | On the internet |
| Can | Find and install a product itself | Only recommend it; the user adds the connector |
| Best surface | A skill plus a CLI | An MCP server (the only way in; ChatGPT cannot run an external CLI) |

Nevo David's advice is to build for both so every kind of agent can use the product (LangTalks ep. 69).

## Choosing surfaces

| Surface | Reaches | Cost | Add when |
| --- | --- | --- | --- |
| Skill (one SKILL.md, maybe references) | Personal agents; skill marketplaces | Lowest | Almost always first. A docs site or library may need nothing more. |
| `llms.txt` and Markdown docs | Agents reading docs; LLM search | Low | The product has public docs or pages worth citing. |
| CLI | Personal agents | Medium | Agents need auth, many calls, or long request bodies. |
| MCP server (through $mcp-ify) | Remote agents; Claude and ChatGPT marketplaces; MCP directories | Highest | Remote agents or marketplaces matter, or the server must hold state. |
| Plugin packaging | Claude Code, Agent Plugins hosts, plugin crawlers | Low once the above exist | There is a skill and a server worth bundling. |

Skip what the product does not need, and say why in the plan.

## Writing the skill

Nevo built the first Postiz skill from the public docs, which were already Markdown, using only the most popular endpoints to avoid bloat. Rules:

- **One job per skill.** Split by task, not by endpoint. Several Markdown files that reference each other are fine; keep the main file short.
- **Descriptions trigger on the user's words.** Include the outcome words people use, and phrases builders say mid-task ("before I build this", "is this worth building", "schedule this post"), not just the product noun.
- **Restate the product's hard rules** in the skill: what it must never do, what needs the user's confirmation, what it costs.
- **Use only API calls or the documented CLI.** No scraping, no undocumented endpoints. Marketplace scans such as ClawHub's are reported to flag CLI-heavy skills more often; if that matters for a listing, keep a variant that uses only documented API calls.
- **No API key in the agent's context.** A skill that has the agent write raw requests puts the key in context the whole time, where it can leak. Point the skill at a CLI that reads the key from the environment, or at the MCP server.
- **Say what the agent will not do**, and how dangerous actions are confirmed (see below).
- **Validate the frontmatter:** `name` lowercase-hyphenated and identical to the folder; `description` present and under 1024 characters. Run `scripts/check-distributable.mjs` on the folder.
- **Claims and examples come from the product's docs.** No invented flags, endpoints or limits.

For a library, the skill teaches its public API and common tasks with examples taken from its docs or tests. For a content site, the skill can be a guide to finding and citing its pages, paired with `llms.txt`.

## Designing the CLI

The CLI is a thin proxy to the API. Nevo's reasons to prefer it over MCP for personal agents (LangTalks ep. 69; Mixergy, 11 Mar 2026):

- A call is one line, so a failed call is cheap to retry with different flags.
- There is less context to resend and less context rot; MCP sends large JSON on every call. MCP still fits when the server must hold state.
- Short flags replace long nested JSON bodies, so the agent sends better content and the skill file stays short.

Build it so a human meeting it for the first time could learn it, because the agent has to explore it:

- `--help` on every command with parameters, defaults and an example.
- A harmless status command (`whoami`, `status`) that never spends or mutates.
- Machine-readable output (`--json`), stable exit codes, and non-interactive flags.
- Never print tokens. Dangerous commands follow the confirmation rule below.
- Reuse the product's API client and error messages; do not fork business logic.

Publishing the CLI (npm, Homebrew, PyPI) is an external action that needs its own approval.

## Authentication per surface

| Surface | Prefer | Fallback | Never |
| --- | --- | --- | --- |
| Skill | Delegate auth to the CLI or MCP server | — | The agent holding or pasting an API key |
| CLI | `tool login` through browser OAuth; the token is stored by the CLI and never passes through the model | API key in an environment variable or the host's secret store, set by the user | Asking the model to set the key; printing it |
| MCP | OAuth; dynamic client registration is reported as required for the Claude and ChatGPT marketplaces | API key in an `Authorization` header (or URL) for self-serve connections | Passwords or session cookies in chat |

MCP authentication details belong to $mcp-ify. A key in a URL ends up in logs and shared configs; prefer the header where the client supports it, and never put a real key in a distributed `mcp.json`.

## MCP server

Hand building or changing the server to $mcp-ify. This skill only checks and reports what agents see:

- transport (streamable HTTP for remote servers) and a stable public URL;
- an `instructions` field saying when to use the server and what it will not do;
- tool annotations that match behavior (read-only, destructive, open-world);
- an unauthenticated probe that fails cleanly and points to how to connect.

Gaps in these go into the plan as $mcp-ify tasks.

## Dangerous actions

Tools that spend money, send messages or delete data must not run silently. Options, in order of preference:

1. **Hand the user a link to confirm.** The agent prepares the action and returns a URL; a person confirms in the product's UI. Nevo notes that even when Postiz's CLI offers a purchase, a checkout page opens for a person to pay (Starter Story, 30 Jul 2026).
2. **Spending controls through $mcp-ify:** a human-approved allowance enforced in server code.
3. **Draft only:** the agent creates a draft the user sends.

An approval flag the agent can set itself is not a confirmation.
