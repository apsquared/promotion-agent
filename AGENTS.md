# Working in promotion-agent

Read README.md, docs/HANDOFF.md, docs/PLAN.md, and docs/ARCHITECTURE.md before implementation. This repository is self-contained; do not require another project checkout to build or test it.

- Preserve unrelated edits. Do not modify or scan other product repos unless the user explicitly adds them for the task.
- Work through the plan in dependency order. Update its status and the handoff with evidence when a milestone is completed.
- Keep all three agents on one workflow contract. Agent-specific behavior belongs in adapters and generated entry points.
- Do not claim the web app, an integration, or a publishing action works until verified.
- Default new projects to draft/review mode. No automatic commit, push, external posting, or spending.
- CLI permission settings and deterministic gates enforce boundaries; prompt text alone is not a sandbox.
- Keep secrets, machine-specific paths, real task queues, customer information, and account IDs out of fixtures and commits.
- A failed or invalid task import must never authorize archival or deletion.
- Use stable project IDs, not mutable display-name slugs, for identity.
- Run npm test for core changes; add relevant integration/UI tests as those layers arrive.
- Do not add subagents, paid services, dependencies, or complexity without a concrete need.
- Treat reference/ as design source, not production code. Do not restore hosted admin or database-only completion behavior.
