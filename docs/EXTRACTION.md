# Extraction record

Source: the owner's AP2 repository at commit a86e4058cedf8baebd287ea7c33f440341b02a18. Extraction date: 2026-09-26. No source checkout is required to continue this project.

| Source relative path | Destination | Treatment |
|---|---|---|
| .claude/skills/sweep-tasks-to-mongo/scripts/sweep-tasks.mjs | src/core/legacy-tasks.mjs | Extracted pure task parser; added snapshot diagnostics; no Mongo imports or execution |
| utils/marketingTaskPrompt.ts | src/core/task-prompt.ts | Retained typed prompt generation and category fallbacks; generalized browser, provider, project settings and git assumptions |
| app/admin/TasksBoard.tsx | reference/legacy-task-board.tsx.txt | Sanitized, non-runtime reference for UI port |
| marketing-template/SKILL.md | templates/WORKFLOW.md | Rewritten provider-neutral contract; draft-first, configurable validation/timezone and explicit action policy |
| marketing-template/AGENT.template.md | templates/marketing/AGENT.md | Rewritten generic project context |
| marketing-template/TASKS.template.md | templates/marketing/TASKS.md | Generic compatible task format and instructions |
| marketing-template/logs/*.md | templates/marketing/logs/*.md | Preserved formats; provider-neutral identifiers |
| MY_PROJECTS.md and marketing-template/SETUP.md | docs/PLAN.md, docs/ARCHITECTURE.md | Captured onboarding/import requirements; actual portfolio and account table excluded |
| utils/db/marketingTasksShared.ts, utils/db/marketingTasks.ts, app/api/admin/tasks/[id]/route.ts | docs/ARCHITECTURE.md and this record | Captured state semantics; no hosted DB/auth code copied |

## Existing behavior to preserve

One activity per run; seasonal override and longest-gap rotation; anti-duplication using ledgers; self-contained tasks; generic per-category fallback when Prompt is absent; explicit review boundaries; classification of missing/partial/unreadable projects; per-successful-project reconciliation.

## Problems deliberately not carried forward

Hardcoded people/accounts/paths; required MongoDB and hosted admin; mandatory Post Bridge; fixed timezone; unconditional npm build/commit/push; browser-plugin-specific instructions; project IDs derived from mutable display names; silent task disappearance on parser failure; UI completion that never updates the source file.

Old board semantics: resolution=completed/skipped overrides imported status; otherwise repo done means completed; archived remains archived. Assignment and resolution were DB-only and survived sweeps. This is documented for migration, not adopted as the new authority model.

## Project-specific variations captured as requirements

Custom product media generators, different daily social caps, database-backed content publishing, research-only outreach, and deployment-triggering pushes belong in explicit project configuration/extensions. No actual product contexts, customer data, real queues, private research, credentials, social account tables, or media were copied.

## Rights and release

Only user-owned source material was selected; no third-party skill packs or dependency source were copied. Source repo had no top-level LICENSE found during extraction. MIT is the proposed project's selected license under the owner's instruction to extract an open-source project; confirm contributor ownership/attribution before public release. No public hosting or npm release has occurred as part of this bootstrap.

## Limits

The extracted parser is not yet a format-preserving writer. Snapshot diagnostics are a starter gate, not complete Markdown validation. The UI reference is not runnable. Prompts express policy but do not enforce it. CLI compatibility references are design inputs, not evidence of live integration tests. All of these have explicit implementation tasks.
