# Interactive use

Open this promotion-agent checkout in your existing Codex, Claude Code, or OpenCode session. The session owns the model, login, tools and permissions. This project supplies workflow instructions and local file helpers; it never launches an AI CLI.

## Start work

In Codex:

```text
$promotion-agent Prepare a directory submission kit for examples/example-desk. Draft only.
```

In Claude Code or OpenCode:

```text
/promote examples/example-desk directory draft only
```

Or in any agent, including when native discovery has not refreshed:

```text
Read templates/WORKFLOW.md and perform it interactively for examples/example-desk, task T-001. Draft only.
```

Supply an explicit project path when working beyond this fictional example. Opening this repository is not permission to scan other product repos. The agent reads the selected project's own instructions and facts, chooses or follows one activity, produces reviewable materials, and reports verified results in the conversation. A prepared submission kit does not mean a listing was submitted.

The native entry points are `.agents/skills/promotion-agent/SKILL.md`, `.claude/commands/promote.md`, and `.opencode/commands/promote.md`. All reference `templates/WORKFLOW.md`; they do not maintain separate marketing logic, force a model, change tool permissions, or create subagents. The P04 installer can place a complete, portable copy in one explicitly selected product. No global installation or changes to real product checkouts were performed.

Native discovery locations are documented by [Codex](https://learn.chatgpt.com/docs/build-skills), [Claude Code](https://code.claude.com/docs/en/slash-commands), and [OpenCode](https://opencode.ai/docs/commands/). The layouts and helper behavior are checked locally; invoking the native menu in all three applications is not claimed as verified.

## Optional local task helpers

Run these from this checkout, using Node 22.14+. They are deterministic local programs, not agent CLIs. They need no model account, provider credentials, paid service or running server.

```sh
npm run promotion -- inspect --project examples/example-desk
npm run promotion -- prepare --project examples/example-desk --task T-001
```

`inspect` reads the selected project's `promotion-agent.json`, configured context file and task snapshot. It returns the strict diagnostics and current content hash. `prepare` returns context, policy and the existing task's prompt for the current agent; it rejects invalid snapshots and completed/unknown tasks. Both are read-only and create no database.

Projects using these helpers need the P01 config format shown in `examples/example-desk/promotion-agent.json`. Without that config, the skill can still draft from explicitly supplied project instructions/facts. The P04 installer previews a new config and starter files only when absent; it never overwrites existing project instructions, facts, tasks, or logs.

## Install into one product

From a built promotion-agent checkout, run `onboard --project <selected-directory> --name <display-name> --plan <new-private-plan.json>`. It writes a review plan without touching the product. Read its entries and before/after content. Run `install --project <same-directory> --plan <reviewed-plan.json> --review-hash <hash-from-onboard>` to apply that exact plan. A changed file, path substitution, invalid plan, or symlink target fails closed. Keep plan files private because they may contain existing product text. The installer does not add instructions to an existing `AGENTS.md` or `CLAUDE.md`.

Inside the installed product, use `$promotion-agent`, `/promote`, or read `.promotion-agent/templates/WORKFLOW.md` directly. The installed `.promotion-agent/docs/INSTALLED.md` explains local helper commands. The bundle is relative to the product root, so it moves with the project. Re-run preview/install from a newer source bundle to upgrade; unmodified managed files update, while edits to a local workflow or command are preserved for manual review. Native host discovery still needs interactive verification.

## Evidence, local state and completion

For a configured, open task, `record` stores a task-linked evidence account in `marketing/logs/promotion-agent/` without SQLite. Use the current task hash returned by `inspect` or `prepare`. A `draft` outcome may reference an existing project-relative artifact; its bytes are hashed so later edits are detected. Record the artifact in the project's normal activity/content ledger as its instructions require.

```sh
npm run promotion -- record --project examples/example-desk --task T-001 --expected-hash <reviewed-task-sha256> --outcome draft --reference marketing/drafts/kit.md --summary "Kit prepared for review"
```

Optional `state --project <directory> --database <local.sqlite>` shows current task status and stored dispositions. It reports an absent or unregistered registry without creating a database for an absent path. `disposition --project <directory> --task <T-NNN> --expected-hash <reviewed-task-sha256> --database <local.sqlite> --state skipped --reason <reason>` records a skip without checking the task off. `--state snoozed` additionally needs `--until <future-canonical-UTC-timestamp>`; `--state active` clears the reason and deadline. Completion refuses skipped/snoozed tasks until they are explicitly reactivated. These use the existing project UUID, registry lock and strict task snapshot. They do not change TASKS.md. Use one database per portfolio for shared locks.

Only after an interactive agent has **actually verified** completion and applicable authorization, record `verified-complete` with an external receipt URL or a validated local artifact, review the returned record and hash, and complete the task:

```sh
npm run promotion -- record --project <directory> --task T-001 --expected-hash <reviewed-task-sha256> --outcome verified-complete --reference <verified-https-url-or-local-path> --summary "What was checked"
npm run promotion -- complete --project <directory> --task T-001 --expected-hash <reviewed-task-sha256> --database <private-local.sqlite> --evidence <returned-record-path> --evidence-hash <returned-record-sha256>
```

These commands are illustrative mutations; do not run them merely to try the demo. `record` validates the selected project, open task and current hash, writes a new immutable record file, and returns its SHA-256. For HTTPS references it rejects credentials, query strings and fragments to avoid storing token-bearing URLs. A URL is a pointer, not a network verification by the helper. The agent must inspect the actual provider confirmation, destination or local validation before choosing `verified-complete`. `complete` checks the exact record hash, task/project/revision binding and local-reference hash, then uses P02's lock/hash/atomic-write/read-back path. It changes only the checkbox, retains existing local preferences, and refuses implicit relocation. Append the verified outcome to the selected project's existing ledger separately when required.

A draft record, stale task hash, changed local artifact, mismatched record hash or invalid task snapshot blocks completion. Review the current source before retrying. The evidence record is an agent-supplied account, not independent proof of an external action. Raw file edits from an agent would bypass these helper checks: the skill is guidance, not a sandbox. The interactive host's permissions and the user's authorization still govern file changes and external tools.

## Review and tools

Use available browser, media, or publishing integrations when they are relevant and already authorized. Missing tools yield useful drafts or a manual handoff. Never diagnose installed agent CLIs as a prerequisite to doing the work. Do not infer publication from generated text, mark draft-only preparation as a completed submission, or store passwords/tokens in context, tasks or logs.

No mandatory localhost UI, scheduler, background runner, or publishing service is part of the interactive workflow. The retained storage library is optional infrastructure for local state and guarded completion.
