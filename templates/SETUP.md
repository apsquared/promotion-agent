# Conversational product setup

Use this procedure for a request to set up, install, or upgrade promotion-agent in one selected local product. The current agent does the work with its existing tools. The user supplies the product and reviews meaningful choices; they do not operate the helper CLI.

## Select and inspect

Resolve the explicit local checkout from the conversation. If only a product name or site URL was supplied, ask for its local repo path; do not search sibling repos. Read its project instructions, existing marketing context, tasks and recent logs, plus relevant product documentation. Note pre-existing changes. Treat a URL as a source of facts, not a filesystem destination.

Explain the concrete scope briefly: install local workflow/helper files, preserve existing instructions and marketing work, and keep work in draft mode. A request to set up/install authorizes this local scope; a preview-only request does not authorize applying it. Respect explicit review stops and active session permissions. If setup is already authorized, do not add a second permission step merely to copy a hash.

## Run the existing installer

Resolve the helper relative to the workflow you are reading:

- In a source checkout, check Node 22.14+ and build with `npm run build`; run `npm ci` first if its pinned development dependencies are missing. Execute commands in the promotion-agent source, not in the product. Never run the product's install/build scripts just to install this workflow.
- In a compiled or installed bundle, use its existing `scripts/promotion.mjs` with Node. No package install or original source checkout is required.

Use the CLI reference in `docs/INTERACTIVE.md` (relative to this workflow's parent directory) or the helper's `--help`. Create a uniquely named private temporary plan outside the product. Quote paths safely and treat all product names and arguments as data.

1. Run `onboard` with the selected project, display name, and new plan filename.
2. Read the actual plan's root, before/after contents, and preservation decisions. Summarize the files being added or upgraded and any customizations being preserved. Keep the full plan available locally for review; do not copy private product contents into public output.
3. If installation is authorized, run `install` using that exact plan and the returned `reviewHash` yourself. If the user asked to review first, show the summary and wait for their approval of that plan. A changed project or plan requires a fresh preview and review; do not bypass hash, ownership, path, or conflict checks.
4. Inspect changed paths and confirm product-owned files and unrelated edits were preserved. Report conflicts or invalid configuration honestly; do not silently replace a config or task queue to get past a failure.

Do not create an extra installer, weaken deterministic checks, launch AI subprocesses, or configure accounts or a database for drafting.

## Ground the context and finish

If the installer created a new marketing context template, fill that newly created file with facts supported by the selected project's documentation and include source paths. Mark unknowns. Read existing context as-is; propose substantive corrections instead of replacing it. Do not manufacture tasks or rewrite an existing queue as part of setup. Product-specific allowed paths and user scope still govern these edits.

Where configuration is valid, run the installed `inspect` helper to check context and task readability. Report an invalid or unsupported task format as a tracking limitation; leave it intact. Drafting can still use the available facts without task completion helpers.

Return a short setup result: selected project, files installed/preserved, product facts and gaps, and any blocked capability. Keep the conversation on the same product. If the user also requested a draft, continue straight into that activity using WORKFLOW.md. Otherwise invite a simple next request such as "Draft one X post."

The current conversation can read the installed workflow directly; no chat switch or native menu refresh is required to produce the first draft. For future sessions opened in the product, the installed skill/command is available subject to host discovery. Do not claim native menu discovery was verified just because the wrapper file exists.
