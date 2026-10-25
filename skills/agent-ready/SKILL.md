---
name: agent-ready
description: Make a product agent friendly - usable by AI agents, packaged where agents install from, and listed where agents and the people driving them look. Use for "make this agent friendly / agent-ready", "get us into the Claude / ChatGPT marketplace", "publish a skill, CLI or plugin for our product", "list our MCP server", llms.txt and connect pages, or "why don't agents use or recommend our product". Works for a SaaS, developer tool, API, open-source library or content site. Audits first, then plans, builds, packages, lists and verifies; hands MCP server design and implementation to $mcp-ify.
license: MIT
---

# Agent Ready

Make a product something AI agents can use, install and recommend. Audit what agents can already do with it, fill the cheapest gaps first, package once for several formats, list it where agents look, and verify each step live. Adapt to what the project already has: its stack, docs, repos, deploy path and copy rules. Do not assume one.

## Modes and hard boundaries

Follow the requested mode: **audit**, **plan**, **build**, **list** or **review**. Invocation alone authorizes inspection and a plan, nothing external.

- Edit the product repo only when the user asks for implementation. Preserve unrelated uncommitted changes. Commit only when asked, and then only the files this work changed; never stage the user's other work.
- Every external action needs its own approval, with the exact content and destination shown first: submitting to a directory or marketplace, opening a PR or issue on someone else's repo, changing GitHub repo metadata, publishing a package or mirror, pushing, deploying, posting. Approval of one action never carries over to another.
- Never create accounts, sign in, paste credentials or pay for listings. Prepare the materials and hand that step to the user. A target that needs an account of a certain age, a Team/Enterprise org or reviewer test credentials is a **blocker**: state exactly what the user must do.
- No secrets in anything distributed. Manifests, `mcp.json`, skills and READMEs are public. Add a check that fails on a credential-shaped value or a machine-specific path; [check-distributable.mjs](scripts/check-distributable.mjs) is a dependency-free starting point to run or port into the project's tests.
- Claims come only from the product's own sources: docs, site, repo. Never invent capabilities, numbers or compatibility. Respect the product's copy rules (for example, a ban on showing spend metrics) and its smoke tests.
- Agents must not do the dangerous thing silently. A tool that spends money, sends messages or deletes data needs a human confirmation step outside the agent, or the decision recorded through $mcp-ify's spending controls. Handing the user a link to confirm is a good default.

**Relationship to $mcp-ify.** mcp-ify owns designing, implementing and reviewing a customer MCP server: tool contracts, auth and connection UX, spending controls and verification. When the plan calls for building or changing an MCP server, hand that step to $mcp-ify and do not restate its guidance here. If it is not installed, say so and give its install line from the [skills collection readme](https://github.com/apsquared/promotion-agent/blob/main/skills/readme.md#install): `npx skills add apsquared/promotion-agent --skill mcp-ify`.

## The model

Two kinds of agents, and a product needs both (read [surfaces](references/surfaces.md)):

- **Personal agents** run on the user's machine (Claude Code, Codex, OpenClaw, Hermes, Cursor). They can find and install a product, and they do best with a skill plus a CLI.
- **Remote agents** run on the internet (ChatGPT, Claude on the web). They can only use an MCP server, and they can only recommend a product; the user adds the connector. ChatGPT cannot run an external CLI, so MCP is the only way in there.

A skill is a Markdown file and the cheapest first step. Nevo David's order for Postiz was one SKILL.md, then a CLI, then better docs, then SEO pages about using the product with agents. Building for agents is also a distribution channel: he reports Postiz went from about $21K to about $103K MRR within roughly two months of becoming agent-ready, and about 1.2M downloads from Claude's marketplace, after which Claude began recommending Postiz on its own. Cite these as his claims, never as expected results.

## 1. Audit before proposing

Inspect and record an evidence map of what agents can already use:

- public API and docs, and whether docs are already Markdown;
- an existing MCP server: route, transport, auth, tool annotations, server instructions;
- skills, plugins and their manifests; a CLI and its auth;
- `llms.txt`, a connect or install page for agents;
- public vs private repos, any mirror script, and how the site actually deploys;
- registry ownership files (`.well-known/*`) and existing listings.

**Check the live state, not only the repo.** Probe the MCP endpoint without auth, query the official MCP registry (`https://registry.modelcontextprotocol.io/v0/servers?search=<name>`), look up each directory listing, fetch `/llms.txt`, and read the public repo's description, topics and last push. Repo bookkeeping drifts: a task list once said "not listed" for a server that had been live in the registry for two weeks. Mark each finding *repo*, *live* or *unverified*. When a listing cannot be checked (a page that renders results in the browser, a gated or retired API, a 403), use a browser if the session has one; otherwise record *could not check*, never *not listed*.

## 2. Pick surfaces from the gap, cheapest first

Start with a skill for personal agents. If the product needs auth, the skill ships with the CLI or MCP server it calls, because the skill itself must never hold a key; a public, keyless API or a docs site can ship the skill alone. Add MCP (through $mcp-ify) for remote agents and marketplaces. Add a CLI when personal agents need auth or many calls. Add plugin packaging to bundle skill and server. Skip what the product does not need: a docs site may need only a skill and `llms.txt`; a library needs no connector. Present the plan with cost, reach and blockers per item, and wait for the user's choice before building, unless they already asked you to build (then build the repo-only items and still ask before anything external). In plan mode, read the references for the steps the plan covers; listing packets can wait until the surfaces they describe exist.

## 3. Build the surfaces

Read [surfaces](references/surfaces.md) for skill-writing rules, CLI design and auth per surface. In short: one job per skill; descriptions that trigger on the user's words, including mid-task phrases ("before I build this", "is this worth building"); restate the product's hard rules; use only API calls or the documented CLI; never put an API key in the agent's context; `name` matches the folder.

## 4. Package once, for several formats

Read [packaging](references/packaging.md). One public folder can carry the open Agent Plugins manifest, the Claude Code plugin layout and a `skills/` directory that both read unmodified (and skills.sh discovers). If the product repo is private, mirror the folder to a public repo with `git subtree push` from a script that refuses uncommitted or non-conforming files, backed by a conformance test.

## 5. Make it legible to crawlers and agents

Read [discovery assets](references/discovery-assets.md): public repo description and topics, a README whose first paragraph works as a standalone listing with the install line near the top, a connect page with copyable install lines per client and a Cursor install link, an `llms.txt` that links only to live pages, and an MCP `instructions` field saying when to use the server and what it will not do.

## 6. List it where agents look

Read [directories](references/directories.md), which is dated: re-read each target's current official docs before acting and update the date when you do. Order of value: official marketplaces (Claude, ChatGPT); the official MCP registry, which other directories ingest; curated directories (Glama, PulseMCP, Smithery); awesome lists on GitHub; skill marketplaces (ClawHub, skills.sh); long-tail indexes. For each target, prepare the exact submission, list blockers, and ask before submitting.

## 7. Promote the agent use case

Read [marketing](references/marketing.md) for the angles: outcome-led posts about what an agent can now do with the product, "I built an X node / skill" posts where builders gather, integrations inside other people's workflows, and outreach to template and course authors. Hand drafting to the marketing skills available in the session rather than writing campaigns here. To measure whether assistants now recommend the product, point to promotion-agent's AI visibility activity (`promotion-visibility`) as the re-measure step.

## 8. Verify and track

Report the evidence level each item reached: **built**, **locally tested**, **committed**, **published** (mirror or registry), **submitted** (pending review), **live and verified** (with its URL). Pushing is not deploying: confirm the live URL after a deploy, since some projects deploy only from a CLI. Before deploying, list everything that will go out, not only this work's commits. Leave an executable follow-up list, or tasks in the project's own tracker, for every pending review and blocked submission, and recheck pending reviews later rather than assuming them.

## Pitfalls from a real run

- Bookkeeping said two listings were pending; both were already live. Audit live first.
- The public mirror had no topics and was seven weeks stale, and crawlers read exactly that repo.
- `/llms.txt` returned 404: a cheap gap.
- The MCP server set no `instructions`, so agents had no "when to use me" text.
- A push did not deploy; the project deployed only through its CLI.
- Another commit landed on main between push and deploy and shipped too.
- A page smoke test banned dollar amounts. Respect existing contracts and update smoke tests with each surface change.

## Completion report

Give the evidence map, the chosen surfaces and why, changed files, prepared submission packets, blockers with the user's exact next step, and per-item evidence levels. Mark untested, unverified and inapplicable items explicitly. See [adaptation examples](references/examples.md) for representative products and the scenarios this skill is checked against.
