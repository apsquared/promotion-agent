# Discovery assets

Make the product legible to crawlers, LLM search and agents. Every asset here is public: claims come from the product's sources, and nothing contains a secret.

## llms.txt

Serve `/llms.txt` at the site root (a 404 here is a common, cheap gap). Format, from the llms.txt proposal:

```markdown
# <Product>

> One or two sentences: what it is, who it is for, and how agents can use it.

## Docs
- [Quickstart](https://<host>/docs/quickstart): first task in five minutes
- [API reference](https://<host>/docs/api): endpoints and auth

## Agents
- [Connect](https://<host>/connect): MCP server, skill, CLI and plugin install lines
```

- Link only to live pages. Fetch every URL after deploy and fail on non-200 responses.
- If docs exist as Markdown, link the `.md` versions or offer an `llms-full.txt`.
- Keep it short and current; regenerate it from the docs' navigation if the project has one.

## Public repo metadata

The public repo (or mirror) is the listing for crawlers and plugin directories.

- **Description** naming the clients: for example "<Product> MCP server, skill and plugin for Claude, ChatGPT, Codex and Cursor."
- **Topics**: `mcp`, `mcp-server`, `model-context-protocol`, `claude-code-plugin`, `agent-skills`, `agent-plugins`, plus the product's domain words. Use only topics that apply.
- **Homepage** set to the connect page.
- Recently pushed. A stale mirror reads as abandoned.

Changing repo metadata is an external action: show the exact description, topics and homepage, then ask. With approval, `gh repo edit <owner>/<repo> --description "..." --homepage "..." --add-topic mcp --add-topic agent-skills` applies it; read it back with `gh repo view <owner>/<repo> --json description,repositoryTopics,homepageUrl,pushedAt`.

## README first paragraph

Write the first paragraph so it works as a standalone listing: what the product does, for whom, and which agents can use it. Put install lines right after it, before badges or long prose:

```text
npx skills add <owner>/<repo>
/plugin marketplace add <owner>/<repo>
claude mcp add --transport http <name> https://<host>/mcp
```

Use only lines that work for this product. A remote-only server gets no `npx` server command. If the repo or package is not public yet, say the lines work only after publishing, and verify each one once it is.

## Connect page

A public page (for example `/connect` or `/agents`) with:

- copyable install lines per client: Claude Code, Claude web connector, ChatGPT, Codex, Cursor, skills.sh;
- a one-click Cursor install link, using the web-link variant for websites (see [packaging](packaging.md#cursor));
- the MCP server URL and auth type; the CLI install and `login` command;
- a short prompt the user can paste to an agent to set itself up and run a harmless check;
- what agents can and cannot do, and how dangerous actions are confirmed.

The in-app connection settings page (connected apps, consent, disconnect) belongs to $mcp-ify. Reuse the site's design system, and update the site's smoke tests with the new page. Respect existing contracts, such as a test that bans dollar amounts on pages.

## MCP server metadata

Check, and route fixes through $mcp-ify:

- an `instructions` field saying when to use the server and what it will not do;
- accurate tool annotations, with `readOnlyHint`, `destructiveHint` and `openWorldHint` set explicitly on every tool (ChatGPT's review requires all three);
- tool names and descriptions written in the user's words, which directories such as Glama score.

## Ownership files

- **MCP registry:** a DNS TXT record or an HTTP well-known file proves the namespace; follow the publisher CLI's current instructions for the exact path and content.
- **Glama:** `/.well-known/glama.json` with the claim token Glama issues to the signed-in user.

Tokens in these files are issued for public verification and are expected to be public, but they come from the user's account: the user retrieves them, and deploying the file is an external action that needs approval.
