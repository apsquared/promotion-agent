# Contributing

Choose one bounded task from docs/PLAN.md. Describe the user-visible problem, intended behavior, and acceptance evidence in your change.

Run `npm test` on Node 22.14+. Future adapters must include offline contract fixtures and a documented opt-in live smoke test. CI must not require real provider credentials. Never record real tokens or full private agent transcripts in fixtures.

Workflow contributions need: purpose, required capabilities, inputs, output artifacts, budgets, review requirements, evidence of completion, and a fictional example. Connector contributions need: capability detection, error handling, verification, and a safe retry strategy for uncertain external writes.

Preserve existing project customization during upgrades. Do not vendor third-party skills without reviewing their license and attribution requirements.
