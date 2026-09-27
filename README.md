# promotion-agent

An interactive marketing workflow for Codex, Claude Code, and OpenCode. Open this repo in your agent, select a product, and prepare useful marketing work using that product's facts, tasks, and logs.

Source: [github.com/apsquared/promotion-agent](https://github.com/apsquared/promotion-agent) · [MIT license](LICENSE)

![Promotion-agent: marketing work inside your agent](assets/opengraph.png)

The **current agent does the work in your conversation**. There is no AI CLI runner, authentication probe, required web app, or background scheduler.

## Use it

Codex:

```text
$promotion-agent Prepare a directory kit for examples/example-desk. Draft only.
```

Claude Code / OpenCode:

```text
/promote examples/example-desk directory draft only
```

Any agent can also read `templates/WORKFLOW.md` and follow it directly. See [interactive use](docs/INTERACTIVE.md) for entry points and optional task helpers. Native command-menu execution across all three hosts has not been verified.

## Add one selected product

Build this checkout, preview installation into one explicit product directory, review the plan file and summary, then apply the exact review hash printed by `onboard`:

```sh
git clone https://github.com/apsquared/promotion-agent.git
cd promotion-agent
npm ci
npm run build
npm run promotion -- onboard --project /path/to/product --name "Product name" --plan /private/tmp/product-install-plan.json
npm run promotion -- install --project /path/to/product --plan /private/tmp/product-install-plan.json --review-hash REVIEW_HASH
```

The plan contains before/after file contents and the selected absolute path; keep it private. Installation creates a portable `.promotion-agent/` runtime and repo-local skill/commands. Existing project instructions, facts, tasks, logs, and customized entry points are preserved. Repeating this process with a newer bundle upgrades only unmodified managed files. The installed product can move with its runtime and use `node .promotion-agent/scripts/promotion.mjs ...` without this source checkout. See [interactive use](docs/INTERACTIVE.md) for details.

## Local helpers and tests

Requires Node 22.14+. Building/onboarding this source checkout uses its pinned development dependencies; an installed product needs no package install, model credentials or external database for drafting.

```sh
npm run promotion -- inspect --project examples/example-desk
npm run promotion -- prepare --project examples/example-desk --task T-001
npm test
```

Helpers inspect/prepare tasks without changing files. Explicit completion uses the existing SQLite, project lock, content-hash and atomic-write checks. Drafting does not require a database. No helper invokes an AI provider or launches an agent.

Task-linked `record` writes a local evidence account without SQLite; `state` and `disposition` expose optional skipped/snoozed state. `complete` now requires the reviewed `verified-complete` record path and hash in addition to the task hash. The agent must verify the underlying action; the helper only validates the record and file preconditions. See [interactive use](docs/INTERACTIVE.md).

## Project guidance

- [Canonical workflow](templates/WORKFLOW.md): one activity, evidence-grounded facts, draft/review defaults.
- [Plan](docs/PLAN.md) and [handoff](docs/HANDOFF.md): current scope and next work.
- [Architecture](docs/ARCHITECTURE.md): interactive host and local data boundaries.
- [Storage](docs/STORAGE.md) and [contracts](schemas/README.md): optional infrastructure already implemented.
- [Invocation compatibility](docs/COMPATIBILITY.md): native entry points and verification limits.
- [P05 interactive evidence](docs/P05-VERIFICATION.md): fictional Codex-session drafts, duplicate checks and host limits.
- [Extraction record](docs/EXTRACTION.md), [contributing](CONTRIBUTING.md), and [license](LICENSE).

Select product repos explicitly; preserve their custom instructions and unrelated work. No automatic publishing, spending, commit or push. The npm package remains private; source availability on GitHub does not mean the package is published to npm. A packed tarball was installed in an isolated temporary environment, but no public npm publication or real product installation has occurred. [Release status and steps to published/live use](docs/RELEASE.md) cover native host checks, an outside-founder trial, source provenance, compatibility and publication.

The [social preview image](assets/opengraph.png) is ready for upload in the repository's GitHub **Settings → Social preview** once a public remote is available. Keeping the image in the README alone does not set GitHub's link preview.
