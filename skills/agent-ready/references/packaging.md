# Packaging

Package once, for several formats, from one public folder. Formats change: read each format's current spec before writing a manifest, and validate with the host's own tooling where it exists. The shapes below are illustrative.

## One folder, several formats

```text
<package>/
  README.md                    # first paragraph = standalone listing; install lines near the top
  LICENSE
  plugin.json                  # open Agent Plugins manifest
  mcp.json                     # Agent Plugins server entry (streamable-http)
  .claude-plugin/
    plugin.json                # Claude Code plugin manifest
    marketplace.json           # makes the repo a Claude Code marketplace
  .mcp.json                    # Claude Code server entry (type http)
  skills/
    <skill-name>/SKILL.md      # read unmodified by both formats and by skills.sh
    <skill-name>/references/...
```

Keep one source of truth for shared fields (name, description, version, server URL) and generate or test the rest against it. Every file here is public: run `scripts/check-distributable.mjs` on the folder in CI or the project's test suite.

## Open Agent Plugins

A `plugin.json` describing the plugin plus an `mcp.json` whose server entry uses the `streamable-http` transport and the public server URL. Read the current Agent Plugins spec for required fields and the exact transport key before writing them.

## Claude Code plugin

- `.claude-plugin/plugin.json`: `name` (kebab-case; it becomes immutable once listed in Claude's plugin directory), `description`, `version`, `author`, optional `homepage`, `repository`, `license`, `keywords`.
- `.claude-plugin/marketplace.json`: marketplace `name`, `owner`, and a `plugins` array whose entries give each plugin's `name`, `source` (for example `"./"`) and `description`.
- `.mcp.json`: `{"mcpServers": {"<name>": {"type": "http", "url": "https://<host>/mcp"}}}`. No credentials; OAuth or a user-supplied header handles auth.
- Skills in `skills/<name>/SKILL.md` at the plugin root are picked up as plugin skills.

Install lines for the README and connect page (check current Claude Code docs):

```text
/plugin marketplace add <owner>/<repo>
/plugin install <plugin>@<marketplace>
claude mcp add --transport http <name> https://<host>/mcp
```

Run Claude Code's plugin validation if the installed version has it (see `claude plugin --help`). Bump `version` on every published change.

## Codex and ChatGPT apps

- **Codex** reads skills from `.agents/skills/<name>/` (UI metadata in `agents/openai.yaml`) and remote MCP servers from its own config. Check the current Codex docs for the `codex mcp add` syntax or `config.toml` entry before writing install lines.
- **ChatGPT apps** are MCP servers (optionally with Apps SDK UI) connected in developer mode and submitted for the app directory. See OpenAI's docs (`https://developers.openai.com/plugins/deploy/connect-chatgpt`; the older Apps SDK URLs redirect there) and the plugin guidelines; build or change the server through $mcp-ify.

## Cursor

Cursor's install link (verified on its docs page, 2026-10-25):

```text
cursor://anysphere.cursor-deeplink/mcp/install?name=<name>&config=<base64 JSON>
```

`config` is the base64 of the server entry **without** its name, for example `{"url":"https://<host>/mcp"}`. Build it rather than hand-encode:

```sh
node -e 'console.log(Buffer.from(JSON.stringify({url: process.argv[1]})).toString("base64"))' https://<host>/mcp
```

For websites, third-party guides describe a web-link variant, `https://cursor.com/install-mcp?name=<name>&config=<base64 JSON>`, which opens Cursor from a browser. Cursor's page did not document it on 2026-10-25; open the built link once before publishing it. Cursor's docs also offer "Add to Cursor" button images. Source: `https://cursor.com/docs/mcp/install-links`.

## skills.sh

The skills CLI discovers `SKILL.md` in the repo root, `skills/<name>/`, `.agents/skills/`, `.claude/skills/` and other agent folders (up to three levels deep), and skills declared in `.claude-plugin/marketplace.json` or `plugin.json`. There is no submission form; skills.sh indexes public repos and ranks by installs. Put this near the top of the README and on the connect page:

```sh
npx skills add <owner>/<repo>
```

Add `--skill <name>` when the repo has several. Source: `https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md`.

## Mirroring a private repo

When the product repo is private, publish only the package folder to a public repo:

```sh
git subtree push --prefix=<package-folder> <public-remote> main
```

Run it from a script that:

1. refuses when `git status --porcelain -- <package-folder>` is non-empty;
2. runs the conformance test: manifests parse, shared fields agree, every `SKILL.md` name matches its folder, relative links resolve, `check-distributable.mjs` passes;
3. prints the commits and files that will be published and asks before pushing.

Pushing the mirror is an external action: show the list, get approval, then push. Afterwards, read the public repo back (files, last push) and record it as **published**. Keep the mirror fresh; crawlers and directories read exactly that repo, and a stale mirror with no topics was one of the gaps in a real run.
