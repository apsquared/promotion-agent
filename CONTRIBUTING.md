# Contributing

This guide is for developing promotion-agent itself. To use it for your product, follow [user setup](README.md#use-promotion-agent) and open the private promotion workspace it creates. The source checkout is used for development and, until a standalone installer is released, user setup and upgrades. Keep personal drafts, source mappings and task history outside this repository.

Clone the repository and open the checkout in your coding agent. Read AGENTS.md, then install and check the development environment:

```sh
npm ci
npm run check
```

Choose one bounded task from docs/maintainers/PLAN.md. Describe the user-visible problem, intended behavior, and acceptance evidence in your change.

Run `npm test` on Node 22.14+. Interactive entry points must reference the canonical workflow; local helpers need offline tests. Verify native skill/command discovery separately without spawning AI CLIs. CI must not require real provider credentials. Never record real tokens or full private agent transcripts in fixtures.

Workflow contributions need: purpose, required capabilities, inputs, output artifacts, budgets, review requirements, evidence of completion, and a fictional example. Connector contributions need: capability detection, error handling, verification, and a safe retry strategy for uncertain external writes.

Preserve existing project customization during upgrades. Do not vendor third-party skills without reviewing their license and attribution requirements.

Changes to `main` go through a pull request with both Ubuntu and macOS checks passing against the current base. Administrator enforcement is enabled; direct pushes are not the contribution workflow. Stage only the intended files after reviewing the diff. No second-person approval is required for this solo-maintainer project.
