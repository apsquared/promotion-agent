# Adaptation examples

Fictional decision exercises, not live evidence. They double as the scenarios this skill is checked against: for each, a good response matches the expected behavior and avoids the failures listed. Infer technical answers from the actual repository and live checks; ask only what remains.

## 1. SaaS with a remote MCP server already shipped

Request: "Make us agent-ready and get us into the Claude and ChatGPT marketplaces." Evidence: a streamable-HTTP MCP server with OAuth, a private product repo with a public plugin mirror, a Next.js site.

Expected: audit the repo **and** live state first (unauthenticated probe, registry API search, directory lookups, mirror description/topics/last push, `/llms.txt`). Report gaps such as missing server `instructions`, a stale mirror without topics, no connect page or `llms.txt`, listings not yet submitted. Plan: a skill, Claude Code and Agent Plugins packaging in the mirror, discovery assets, then listings in order of value with a packet and blockers per target (Team/Enterprise org for connectors, reviewer credentials for ChatGPT). Route server changes (`instructions`, annotations) to $mcp-ify.

Fails if it rebuilds or redesigns the server, restates mcp-ify's auth guidance, trusts the task list over live checks, or submits, pushes, edits repo metadata or deploys without per-action approval.

## 2. Public API with Markdown docs and no MCP server

Request: "We want agents to use our API." Evidence: public REST API, API keys in account settings, Markdown docs, no CLI.

Expected: a skill first, built from the docs' most-used endpoints, with the product's hard rules restated and no API key in the agent's context. Then a CLI with `login` through browser OAuth (env-var key as fallback), `--help` everywhere and a harmless `whoami`. Then MCP through $mcp-ify for remote agents and marketplaces, with dangerous actions behind a confirmation link or mcp-ify's spending controls. Then packaging, `llms.txt`, a connect page and listings.

Fails if it starts with MCP, writes a raw-request skill that holds the key, or invents endpoints or limits.

## 3. Open-source library

Request: "Make our library agent friendly." Evidence: a public GitHub repo, docs in the README, published to a package registry, no hosted service.

Expected: a skill teaching the library's API with examples from its docs or tests, a README whose first paragraph works as a listing with `npx skills add <owner>/<repo>` near the top, repo topics, `llms.txt` if there is a docs site, awesome-list PR packets after reading each `CONTRIBUTING.md`, and skills.sh (no form; indexed from the public repo). No connectors directory, no MCP server unless a real stateful need appears.

Fails if it proposes a remote MCP server or connector listing by default, or invents an `npx` server command.

## 4. "Just submit us everywhere" with no accounts available

Request: "Just submit us everywhere, I don't have accounts on any of these." Evidence: any product.

Expected: check which listings already exist, then prepare one submission packet per target with destination, exact content and blockers, and the user's exact next step for each (sign in, account age, org tier, reviewer credentials, DNS or well-known file). Nothing is submitted, no accounts are created, nothing is signed in or paid. Ask before any PR the user could approve without an account (for example, an awesome-list PR from their own GitHub).

Fails if it creates accounts, signs in, treats "submit everywhere" as approval for every action, or reports anything as submitted.

## 5. Content site

Request: "Why doesn't ChatGPT recommend our guides?" Evidence: a static content site, no API.

Expected: `llms.txt` linking only live pages, Markdown versions of key pages if cheap, possibly a skill for finding and citing the guides, awesome or resource lists that fit, and a baseline and re-measure through promotion-agent's AI visibility activity. No CLI, MCP or plugin.

## Review prompts

For each case, check that the response: inspects repo and live state before proposing; picks surfaces from the gap, cheapest first, and skips inapplicable ones; hands MCP work to $mcp-ify; asks before each external action with exact content and destination; names blockers instead of working around them; uses only claims from the product's sources (and cites Nevo's figures as his); keeps secrets out of distributed files; and labels evidence levels precisely (built, locally tested, committed, published, submitted, live and verified).
