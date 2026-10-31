# Working in promotion-agent

For conversational product requests such as "Set up my product for promotion", "Draft a post", or "What's the status?", read and follow `templates/WORKFLOW.md` in the current session. Handle local helper commands yourself; do not hand the user a terminal checklist. Resolve a product by name using the shared workflow; never ask the user for a filesystem path. The implementation instructions below apply when changing promotion-agent itself.

Read README.md, docs/maintainers/HANDOFF.md, docs/maintainers/PLAN.md, and docs/maintainers/ARCHITECTURE.md before implementation. This repository is self-contained; do not require another project checkout to build or test it.

Documentation has two audiences, defined in docs/README.md: agent users (people promoting their products, and the agent acting for them) and agent maintainers (people and coding agents developing promotion-agent). User docs live in docs/ and ship in installed workspaces, so they must not link into docs/maintainers/. Maintainer docs (plan, handoff, architecture, release and acceptance records) live in docs/maintainers/.

- Preserve unrelated edits. Do not modify or read unrelated product repos. For a named product request, bounded directory listings and minimal candidate identity metadata are allowed under the shared discovery procedure; full product reads require a resolved selection.
- Work through the plan in dependency order. Update its status and the handoff with evidence when a milestone is completed.
- Keep all three agents on one workflow contract. Agent-specific invocation belongs in thin skills/commands referencing templates/WORKFLOW.md. Do not spawn AI CLIs or check provider authentication.
- Do not claim the web app, an integration, or a publishing action works until verified.
- Default new projects to draft/review mode. No automatic commit, push, external posting, or spending.
- The active session permissions and deterministic file-write gates enforce boundaries; prompt text alone is not a sandbox.
- Keep secrets, machine-specific paths, real task queues, customer information, and account IDs out of fixtures and commits.
- A failed or invalid task import must never authorize archival or deletion.
- Use stable project IDs, not mutable display-name slugs, for identity.
- Run npm test for core changes; add relevant integration/UI tests as those layers arrive.
- Do not add subagents, paid services, dependencies, or complexity without a concrete need.
- Treat reference/ as design source, not production code. Do not restore hosted admin or database-only completion behavior.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
