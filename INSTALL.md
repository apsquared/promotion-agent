# Install promotion-agent

This page is for an AI coding agent. A person who wants to use promotion-agent for their product will have pointed you here, for example: "Help me install promotion agent using https://raw.githubusercontent.com/apsquared/promotion-agent/main/INSTALL.md".

Your job is to install promotion-agent for that person, ask only the questions below, and then hand them a private promotion workspace they can open for everyday marketing work. Do not ask for a filesystem path for the product. Do not give the person a terminal checklist; run the commands yourself and report the results.

## 1. Ask the person these questions

Ask them together, in one message. Skip any question they have already answered.

1. **Product name.** What is the name of the product you want to promote? (Required. The folder, Git repository, or package name may differ; use the name they give.)
2. **First draft (optional).** Would you like one first draft for review once setup is done? If yes, which platform, for example X or LinkedIn?
3. **Install location (required).** Where should promotion-agent be installed? Offer `~/promotion-agent` as the default. Accept any folder the person names, and keep it outside their product repository.
4. **Workspace location (optional).** Do you want your private promotion workspace in the default location, `~/.local/share/promotion-agent/projects/<new UUID>/`? Tell me only if you want a different one, and keep it outside your product repository.

Wait for the answers before you continue. If the person does not know the product name, ask them to tell you what the product does so you can search for it, but still do not ask for a path. If the person does not know where to install, use the default and say so.

## 2. Check the prerequisites

Run these checks:

```sh
git --version
node --version
npm --version
```

Requirements:

- Git is installed.
- Node.js is version 22.14 or newer, and npm is available.
- You are running as Codex, Claude Code, or OpenCode.

If something is missing or too old, tell the person exactly what to install, link them to the official download page for it, and stop. Continue once they confirm it is installed.

## 3. Install promotion-agent at the chosen location

Use the install location from question 3 as `<clone location>`. Only clone or pull into that folder. If it already holds something other than a promotion-agent clone, stop and ask the person for a different folder.

If the clone location does not already contain promotion-agent, clone it:

```sh
git clone https://github.com/apsquared/promotion-agent.git <clone location>
```

If the location already contains a clone of promotion-agent, update it instead:

```sh
git -C <clone location> pull --ff-only
```

If the pull fails because of local changes, stop and tell the person. Do not discard their changes.

Then disable accidental pushes from this clone. Pulling still works; pushing to origin fails:

```sh
git -C <clone location> remote set-url --push origin DISABLED
```

Keep this clone separate from the person's product repository. Do not write anything into the product repository.

## 4. Set up the product

Work from the clone. Read `templates/SETUP.md` and `templates/WORKFLOW.md` in the clone and follow them. In particular:

- Find the product by name with the discovery procedure in `templates/WORKFLOW.md`. Verify the match, and ask the person to choose only if several plausible checkouts exist.
- Build the clone with `npm run build`. Run `npm ci` first only if the pinned dependencies are missing. Never run the product's own install or build scripts.
- Install into the separate promotion workspace from question 4 (or its default location), using the preview-then-install steps in `templates/SETUP.md`. Installation covers only the local workspace, not the product repository.
- Fill in only the newly created marketing context with facts from the product's own documentation, and mark anything unknown. Do not invent metrics, customers, or testimonials.

If the person asked for a first draft in question 2, prepare it now from sourced facts and keep it in draft/review mode. Do not publish, schedule, commit, push, or spend anything.

## 5. Report the result

Tell the person:

- **The promotion workspace to open for everyday work.** Give its actual resolved path and say, "Open this promotion workspace for future promotion chats."
- **The source clone's location,** and that it is needed only for upgrades and the optional review desk.
- **The product repository,** which stayed read-only.
- **What was installed and what was preserved,** from the install summary.
- **The first draft,** if one was requested, with its saved path in the workspace.
- **Unresolved gaps,** such as product facts you could not verify.

Then offer the next step in one short question, for example: "Want me to make it shorter or prepare another post?" Do not add anything that changes files or publishes content without the person's approval.

## Boundaries

- Drafting and setup need no database, publishing account, or extra model API key.
- Publishing, scheduling, outreach, spending, committing, and pushing each need the person's explicit approval for the exact content, account, and time.
- Product code or content changes need a separate request that names the changes.
- If the person asks to remove or change anything outside the clone and the promotion workspace, confirm first.
