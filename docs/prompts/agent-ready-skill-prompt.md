# Prompt: add an `agent-ready` skill to the standalone skills collection

Paste everything below the line into an agent session opened at the promotion-agent repository root.

---

Add a new standalone skill, **`agent-ready`**, to `skills/`. It instructs an agent how to make **any** product "agent friendly": usable by AI agents, packaged for the places agents install from, and listed where agents and the people driving them will find it. It works for a SaaS, a developer tool, an API, an open-source library or a content site. It adapts to what the project already has rather than assuming one stack.

Read these first and follow their patterns:

- `AGENTS.md`
- `skills/readme.md`: collection rules, catalog table, install section
- `skills/mcp-ify/`: all of it, including `references/`
- `skills/nurture-campaign/`: the closest model for a recent skill's layout and tone
- `docs/maintainers/PLAN.md` and `docs/maintainers/HANDOFF.md`

The skill-creator skill is available if you want its scaffolding and eval loop.

## Relationship to `mcp-ify` (do not duplicate it)

`mcp-ify` already covers designing, implementing and reviewing a customer MCP server: tool contracts, auth and connection UX, spending controls and verification. `agent-ready` is the layer around it:

- **Audit:** what agents can already do with the product.
- **Other surfaces:** a skill and a CLI, packaging as plugins, machine-readable docs.
- **Distribution and discovery:** registries, marketplaces, directories, awesome lists, crawlable repos.
- **Marketing:** content about the agent use case.

When the plan calls for building or changing an MCP server, `agent-ready` hands that step to `$mcp-ify` and links to it. It does not restate mcp-ify's guidance. If `mcp-ify` is not installed, the skill says so and points to its install line in `skills/readme.md`.

## Where it goes

- `skills/agent-ready/SKILL.md`: concise, under about 120 lines. Frontmatter carries `name`, `description` and `license: MIT`, like `mcp-ify`. The description must trigger on requests such as:
  - "make this agent friendly / agent-ready"
  - "get us into the Claude / ChatGPT marketplace"
  - "publish a skill or plugin for our product"
  - "list our MCP server"
  - "why don't agents use or recommend our product"
- `skills/agent-ready/references/`, split by topic. Suggested files:
  - `surfaces.md`: skill vs CLI vs MCP, auth per surface, skill-writing rules
  - `packaging.md`: Claude Code plugin, Agent Plugins, Codex and ChatGPT apps, Cursor install links, skills.sh layout
  - `directories.md`: the dated discovery catalog below, with submission mechanics
  - `discovery-assets.md`: llms.txt, public mirror repo metadata, README first paragraph, connect page
  - `marketing.md`: promoting agent use cases
  - `examples.md`: adaptation examples, like mcp-ify's
- `skills/agent-ready/agents/openai.yaml`, matching the other skills.
- **Catalog:** add a row to the table in `skills/readme.md` with an example request, and mention the skill in the install section's `--skill` list.
- **Plan and handoff:** record the change in `docs/maintainers/PLAN.md` and `docs/maintainers/HANDOFF.md`, as commit e3ec28e did for `nurture-campaign`.

## Hard boundaries (restate these in the skill)

- **Modes.** Follow the requested mode: audit, plan, build, list, or review. Invocation alone authorizes inspection and a plan, not external actions.
- **The product repo** may be edited only when the user asks for implementation. Preserve unrelated uncommitted changes. Commit only the files the skill changed, and never stage the user's other work.
- **Every external action needs its own approval from the user**, with the exact content and destination shown first. That covers:
  - submitting to a directory or marketplace
  - opening a PR or issue on someone else's repo
  - changing GitHub repo metadata
  - publishing a package or mirror
  - pushing
  - deploying
  - posting

  Approval of one action never carries over to another.
- **Never create accounts, sign in, paste credentials or pay for listings.** Prepare the materials and hand the step to the user. Directories that need a GitHub account of a certain age, a Team/Enterprise org, or reviewer test credentials are listed as blockers with exactly what the user must do.
- **No secrets in anything distributed.** Manifests, `mcp.json`, skills and READMEs are public. Add a check (test or script) that fails when a credential-shaped value appears.
- **Claims come only from the product's sources.** Docs, site and repo count; never invent capabilities, numbers or compatibility. Respect the product's own copy rules, for example a ban on exposing spend metrics.
- **Agents must not be able to do the dangerous thing silently.** Tools that spend money, send messages or delete data need a human confirmation step outside the agent, or the explicit decision recorded through mcp-ify's spending controls. A "hand the user a link to confirm" pattern is a good default.

## The model to encode

This is distilled from Nevo David's playbooks: how Postiz became agent-first. The figures are his claims and are cited as such in the skill.

1. **There are two kinds of agents, and you need both.**
   - **Personal agents** run on the user's machine (Claude Code, Codex, OpenClaw, Hermes, Cursor). They can find *and install* a product, and they prefer a **skill plus a CLI**.
   - **Remote agents** run on the internet (ChatGPT, Claude web). They can only use an **MCP server**, and they can only *recommend* a product; the user adds the connector.

   ChatGPT cannot run an external CLI, so MCP is the only way in there.
2. **A skill is just a Markdown file, and it is the cheapest first step.** Nevo built the first Postiz skill from the public docs, using only the most popular endpoints to avoid bloat. His order of work was: one SKILL.md, then a CLI, then better docs, then SEO pages about using the product with agents.
3. **Why a CLI over MCP for personal agents.**
   - A CLI call is one line, failures are retried cheaply, and there is less context rot.
   - MCP resends large JSON every call. It still fits when the server must hold state.
   - Build help commands into the CLI so an agent can discover the parameters.
4. **Authentication.**
   - **Skills:** never have an agent hold an API key in its context. A raw-request skill leaks the key; a CLI reads it from the environment.
   - **CLI:** prefer `tool login` through browser OAuth, so the token never passes through the model. An env-var API key is the fallback.
   - **MCP:** dynamic OAuth (dynamic client registration) is required for the ChatGPT and Claude marketplaces. An API key in the URL or an Authorization header works for self-serve connections.
5. **Building for agents is also a distribution channel.**
   - Nevo reports Postiz went from $21K to about $103K MRR within roughly two months of becoming agent-ready.
   - He reports about 1.2M downloads from Claude's marketplace, after which Claude began recommending Postiz on its own.
   - Agent use cases are a large topic on X, which matches posts to interests rather than followers, so content about them travels.
6. **Get into other people's workflows.** Ship integrations where builders already work (an n8n node or templates, Zapier or Make) and ask template authors to include the product. He describes offering something worth more to them than to you: a free top plan, a newsletter feature, a backlink.
7. **Build around a hype, don't be the hype.** Watch for the next wave (n8n, then MCP, then agents, then whatever comes next) and be early with a surface for it.

## The procedure to encode

1. **Audit before proposing.** Inspect and record an evidence map of what agents can already use:
   - public API and docs, and whether the docs are already Markdown
   - an existing MCP server (route, transport, auth, tool annotations, server `instructions`)
   - skills, plugins and their manifests, and a CLI
   - `llms.txt`, a connect or install page for agents
   - public vs private repos and any mirror script
   - registry ownership files such as `.well-known/*`, and existing listings

   **Check the live state, not only the repo.** Probe the endpoint without auth, query the official MCP registry API, look up the directory listings, and read the public repo's description, topics and last push. In the real run (below), a task list said "not listed" for a server that had been live in the registry for two weeks.
2. **Pick the surfaces from the gap, in order of cost.** Start with a skill for personal agents. Add MCP (through `$mcp-ify`) for remote agents and marketplaces. Add a CLI when personal agents need auth or many calls. Add plugin packaging to bundle skill and server. Skip what the product doesn't need: a docs site may need only a skill and `llms.txt`.
3. **Write the skills well.**
   - One job each, and descriptions that trigger on the user's words. That includes phrases builders use mid-task ("before I build this", "is this worth building"), not just product nouns.
   - Restate the product's hard rules in the skill.
   - Use only API calls or the documented CLI. Scans on marketplaces such as ClawHub are reported to flag CLI-heavy skills more often.
   - Validate the frontmatter: `name` matches the folder.
4. **Package once, for several formats.** One public folder can carry:
   - the open Agent Plugins manifest (`plugin.json` plus `mcp.json` with `streamable-http`)
   - the Claude Code layout (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` with `http`)
   - a `skills/` directory both formats read unmodified. The skills.sh CLI also discovers `skills/<name>/SKILL.md`.

   If the product repo is private, mirror the package to a public repo with `git subtree push`. Do it from a script that refuses to publish uncommitted or non-conforming files, and add a conformance test.
5. **Make it legible to crawlers and agents.**
   - Public repo: a description naming the clients, topics (for example `mcp`, `mcp-server`, `model-context-protocol`, `claude-code-plugin`, `agent-skills`, `agent-plugins`, plus the domain), and a README whose first paragraph works as a standalone listing with the install line near the top.
   - Site: a connect page with copyable install lines for each client, a one-click Cursor install link (built from Cursor's install-link format, with the web-link variant for websites), and an `llms.txt` that links only to live pages.
   - MCP server: an `instructions` field saying when to use it and what it will not do, and accurate tool annotations.
6. **List it where agents look.** Use the catalog below. For each target, prepare the exact submission materials, state the blockers, and ask before submitting. Order of value:
   1. official marketplaces (Claude, ChatGPT)
   2. the official MCP registry, which other directories ingest from
   3. curated directories (Glama, PulseMCP, Smithery)
   4. awesome lists on GitHub, which are high-authority, read by agents and LLM search, and cheap
   5. skill marketplaces (ClawHub, skills.sh)
   6. long-tail indexes
7. **Promote the agent use case.** Hand off to the marketing skills rather than drafting campaigns here. The content angles are:
   - outcome-led posts and articles about what an agent can now do with the product
   - "I built an X node / skill" posts in the communities where builders gather (Skool, Whop, Discord, subreddits)
   - outreach to template and course authors

   For measuring whether assistants now recommend the product, point to the AI visibility activity (`promotion-visibility`) as the re-measure step.
8. **Verify and track.** For each item, report the evidence level reached:
   - built
   - locally tested
   - committed
   - published (mirror or registry)
   - submitted (pending review)
   - live and verified, with its URL

   **Pushing is not deploying.** Confirm the live URL after a deploy; some projects deploy only from a CLI. Leave an executable follow-up list (or tasks in the project's own tracker) for every pending review and blocked submission. Recheck pending reviews later rather than assuming them.

## Discovery catalog (put this in `references/directories.md`, dated)

These were checked on **2026-10-25** from third-party guides and live sites. Marketplace processes change often. The skill must tell the agent to **re-read each target's current official docs before acting** and to update the date when it does.

| Target | Takes | How (as of 2026-10-25) | Notes |
|---|---|---|---|
| Official MCP Registry | Remote or package MCP servers | `server.json` through the publisher CLI. The namespace (for example `io.<domain>/<name>`) is proved by DNS or an HTTP well-known file. | Other directories ingest from it. Check status at `registry.modelcontextprotocol.io/v0/servers?search=`. |
| Claude plugin directory | Claude Code plugins | Console form at platform.claude.com/plugins/submit. It feeds `anthropics/claude-plugins-community`; the official marketplace is curated with no application. | The plugin name is immutable. |
| Claude connectors directory | Remote MCP servers | Anthropic's review form or admin portal. Reportedly needs a Team/Enterprise org and a public HTTPS endpoint with OAuth. | Not the same as the plugin directory. |
| ChatGPT app directory | MCP / Apps SDK apps | OpenAI's app submission guidelines (developers.openai.com). Guides report a test-case set, reviewer credentials without MFA, and written reasons for each tool annotation. | Only OpenAI's own guidelines are authoritative. |
| Glama | MCP servers and connectors | Crawls, then you claim it by serving `/.well-known/glama.json` with a claim token. | It scores tool quality, and it tests OAuth servers too. |
| Smithery, PulseMCP, mcp.so, MCP.Directory, MCP Toplist | MCP servers | Submit form, GitHub issue, or crawl | Ask PulseMCP for the "official" mark. Never invent an `npx` command for a remote-only server. |
| Awesome lists | Servers, skills, plugins | PR, after reading CONTRIBUTING.md. Search GitHub for "awesome mcp servers", "awesome claude code", "awesome codex", "awesome openclaw", "awesome agent skills". | Some require stars or a ClawHub listing. Skip abandoned lists. |
| ClawHub | Skills | `clawhub skill publish` or upload. Needs a GitHub account at least a week old. | Scans may falsely flag; re-uploading reportedly works. A listing unlocks some awesome lists. |
| skills.sh | Skills | No form found. It indexes public repos with `SKILL.md` and ranks by installs. | Put `npx skills add owner/repo` in the README and connect page. |
| Cursor | MCP servers, plugins | Install link `cursor.com/install-mcp?name=…&config=<base64 JSON>`; also cursor.directory | Base64 the server entry without its name. |
| Plugin crawlers (claudemarketplaces.com, claudepluginhub.com and similar) | Claude plugins | Crawl GitHub for `.claude-plugin/marketplace.json` | Repo metadata is the listing. |

## Lessons from a real run (Idea Launch, 2026-10-25), to encode as pitfalls

- **Bookkeeping drifts from reality.** Two listing tasks were open although the registry and Glama listings were already live and verified. Audit live first.
- **Mirrors go stale.** The public plugin repo had no topics and hadn't changed in seven weeks, while crawlers read exactly that repo.
- **No `llms.txt`.** The site returned 404 for it, a cheap gap to fill.
- **No server `instructions`.** The MCP server set none, so agents had no "when to use me" text.
- **Pushing didn't deploy.** The project deployed only through `vercel --prod`. Verify the live URL after every deploy.
- **Someone else's commit shipped too.** Another commit landed on `main` between the push and the deploy, and it went out with it. Before deploying, report everything that will go out, not only your own commit.
- **Respect the product's existing contracts.** For example, a page smoke test that bans dollar amounts. Update the smoke tests along with each surface change.

## Make the skill testable

Write three or four eval scenarios in the style of `mcp-ify/references/examples.md`, and run them before calling the skill done:

- **A SaaS with a remote MCP server already shipped.** Expected: an audit that finds the gaps, packaging and listings with approval gates, and no rebuild of the server.
- **A public API with Markdown docs and no MCP server.** Expected: a skill first, a CLI with OAuth login, `$mcp-ify` for MCP, then listings.
- **An open-source library.** Expected: a skill plus README, awesome lists and skills.sh. No connectors directory.
- **"Just submit us everywhere" with no accounts available.** Expected: prepared materials, named blockers, nothing submitted.

Report structural validation (frontmatter, links resolve after copying the folder) separately from scenario behavior, as `skills/readme.md` asks.

## Done means

- `skills/agent-ready/` exists with SKILL.md, references and `agents/openai.yaml`. All relative links resolve.
- The catalog row and install mention are in `skills/readme.md`, and PLAN/HANDOFF are updated.
- Eval scenarios are written and run, with results summarized.
- No secrets or machine-specific paths appear in the skill.
- Nothing is committed or pushed unless the user asks.

## Sources the skill should cite

- Nevo's Brain, especially:
  - "Marketing to AI agents: skills, CLI vs MCP, agent discovery and authentication" (LangTalks ep. 69)
  - "Agent-first positioning, marketplace listings, n8n outreach and paid reposts" (Alex is Building)
  - "Postiz by stage" (X video, 13 Jul 2026)
  - "How OpenClaw Skills and X Articles Grew Postiz from $20K to $60K MRR"
- Cursor MCP install links: https://cursor.com/docs/mcp/install-links
- skills.sh discovery rules: https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md
- Claude connectors: https://claude.com/docs/connectors
- OpenAI Apps SDK: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt
- ClawHub docs: https://docs.openclaw.ai/clawdhub
