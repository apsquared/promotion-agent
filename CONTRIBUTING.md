# Contributing

Choose one bounded task from docs/PLAN.md. Describe the user-visible problem, intended behavior, and acceptance evidence in your change.

Run `npm test` on Node 22.14+. Interactive entry points must reference the canonical workflow; local helpers need offline tests. Verify native skill/command discovery separately without spawning AI CLIs. CI must not require real provider credentials. Never record real tokens or full private agent transcripts in fixtures.

Workflow contributions need: purpose, required capabilities, inputs, output artifacts, budgets, review requirements, evidence of completion, and a fictional example. Connector contributions need: capability detection, error handling, verification, and a safe retry strategy for uncertain external writes.

Preserve existing project customization during upgrades. Do not vendor third-party skills without reviewing their license and attribution requirements.
