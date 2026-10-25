# Directories and marketplaces

**Checked 2026-10-25** from third-party guides and live sites. Marketplace processes change often. Before acting on any row, re-read that target's current official docs (when preparing its packet, and again just before submitting), follow them where they differ from this table, and update the row's date here (in the project's copy of this skill, if it keeps one) when you do.

Never create accounts, sign in, paste credentials or pay. Prepare the materials, show the exact content and destination, and ask before each submission. Approval of one submission is not approval of the next.

## Catalog

| Target | Takes | How (as of 2026-10-25) | Notes |
| --- | --- | --- | --- |
| Official MCP Registry | Remote or package MCP servers | `server.json` through the publisher CLI. The namespace is the reverse-DNS form of a domain you control (`com.example/<name>` for example.com; `io.github.<user>/<name>` for GitHub auth), proved by DNS, an HTTP well-known file or GitHub sign-in. | Other directories ingest from it. Check status at `https://registry.modelcontextprotocol.io/v0/servers?search=<name>`. |
| Claude plugin directory | Claude Code plugins | Console form at `platform.claude.com/plugins/submit`. It feeds `anthropics/claude-plugins-community`; the official marketplace is curated with no application. | The plugin name is immutable. |
| Claude connectors directory | Remote MCP servers | Anthropic's review form or admin portal (`https://claude.com/docs/connectors`). Reportedly needs a Team/Enterprise org and a public HTTPS endpoint with OAuth. | Not the same as the plugin directory. |
| ChatGPT app directory | MCP / Apps SDK apps (now called plugins) | OpenAI's plugin guidelines (`https://developers.openai.com/plugins/plugin-guidelines`; the Apps SDK URLs redirect there). The live page requires explicit `readOnlyHint`, `destructiveHint` and `openWorldHint` booleans on every tool (written justifications are no longer required) and, for an authenticated server, a demo-account login with sample data and no 2FA. Guides also report a test-case set. | Only OpenAI's own guidelines are authoritative. |
| Glama | MCP servers and connectors | Crawls, then you claim it by serving `/.well-known/glama.json` with a claim token. | It scores tool quality, and it tests OAuth servers too. |
| Smithery, PulseMCP, mcp.so, MCP.Directory, MCP Toplist | MCP servers | Submit form, GitHub issue, or crawl | Ask PulseMCP for the "official" mark. Never invent an `npx` command for a remote-only server. |
| Awesome lists | Servers, skills, plugins | PR, after reading `CONTRIBUTING.md`. Search GitHub for "awesome mcp servers", "awesome claude code", "awesome codex", "awesome openclaw", "awesome agent skills". | Some require stars or a ClawHub listing. Skip abandoned lists. |
| ClawHub | Skills | `clawhub skill publish` or upload (`https://docs.openclaw.ai/clawdhub`). Needs a GitHub account at least a week old. | Scans may falsely flag; re-uploading reportedly works. A listing unlocks some awesome lists. |
| skills.sh | Skills | No form found. It indexes public repos with `SKILL.md` and ranks by installs. | Put `npx skills add owner/repo` in the README and connect page. |
| Cursor | MCP servers, plugins | Install link (see [packaging](packaging.md#cursor)); also `cursor.directory` | Base64 the server entry without its name. |
| Plugin crawlers (claudemarketplaces.com, claudepluginhub.com and similar) | Claude plugins | Crawl GitHub for `.claude-plugin/marketplace.json` | Repo metadata is the listing. |

## Order of value

"The Claude marketplace" can mean the **plugin directory** (Claude Code plugins: skill plus server config) or the **connectors directory** (a remote MCP server for Claude on the web). Prepare whichever the product's surfaces support, and say which one each packet is for.

1. **Official marketplaces** (Claude, ChatGPT). Nevo reports about 1.2M downloads from Claude's marketplace for Postiz, after which Claude began recommending it unprompted (LangTalks ep. 69). He found no submission route for Perplexity or Gemini.
2. **The official MCP registry.** Other directories ingest from it, so one listing propagates.
3. **Curated directories** (Glama, PulseMCP, Smithery).
4. **Awesome lists on GitHub.** High authority, read by agents and LLM search, and cheap. Nevo: the big ones act as a source of truth for agents; some are abandoned or require stars or a ClawHub listing ("Postiz by stage", 13 Jul 2026).
5. **Skill marketplaces** (ClawHub, skills.sh).
6. **Long-tail indexes** and crawlers, which mostly follow from good repo metadata.

Skip targets that do not fit the product: a library has no connector, and a docs site may stop at awesome lists and skills.sh.

## Check before submitting

For each target, first look up whether the product is already listed (search the registry API, the directory's search, the awesome list's README). Record *listed (URL)*, *not listed*, or *could not check*. A search page that renders results in the browser, a gated or retired API, or a 403 is *could not check* unless a browser in the session shows the result. Do not trust the project's own task list for this.

## Submission packet

Prepare one packet per target, built only from the product's own sources. Keep packets in the response (or a file outside the product repo) unless the user asked for implementation; then they can go in the project's follow-up file or tracker.

- **Destination:** the exact form URL, repo and file, or CLI command.
- **Fields:** name, one-line description, long description, categories and tags, homepage, repo, docs, privacy policy and support URLs, logo and screenshots that exist.
- **Server details** (MCP targets): public URL, transport, auth type, tool list with annotations and a written reason for each annotation, server `instructions`.
- **Install lines** that actually work for this product. Never invent an `npx` command for a remote-only server.
- **Reviewer needs:** test cases, and reviewer credentials **the user** creates and enters (never stored in the repo or the packet).
- **Blockers** and the user's exact next step.
- **Evidence:** the date the target's docs were last read.

For an awesome-list PR: read `CONTRIBUTING.md`, match the list's entry format and alphabetical or category order exactly, change one line, and show the diff and PR text before opening it.

## Blockers to state plainly

| Blocker | What the user must do |
| --- | --- |
| Needs an account (ClawHub, Smithery, Glama claim, console forms) | Sign in themselves and paste or upload the prepared packet. |
| GitHub account younger than a week (ClawHub) | Wait, or publish from an older account they control. |
| Team/Enterprise org (Claude connectors, as reported) | Use an org they administer, or skip this target for now. |
| Reviewer demo account without 2FA (ChatGPT) | Create a dedicated reviewer account and enter it in the form themselves. |
| Domain or namespace proof (MCP registry, Glama) | Approve the DNS record or well-known file, then deploy it. |
| Paid listing | Decide; this skill never pays. |

## After submitting

Record each submission as **submitted (pending review)** with its date and where to check. Recheck later and record **live and verified** with the URL only after seeing it. Leave an executable follow-up list (command or URL to check, what "done" looks like) for every pending review and blocked target.
