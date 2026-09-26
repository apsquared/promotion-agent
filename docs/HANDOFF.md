# Continue here

## Current state

A fresh local repository contains the source extraction and plan. The original application and product repositories were not changed. There is no web app, agent runner, database, remote publishing connector, or scheduler yet. No real portfolio was registered or imported.

Completed: pure legacy task parser with reconciliation diagnostics; generalized typed task prompts; provider-neutral workflow; project/task/log templates; fictional fixture with asset; offline regression tests; sanitized UI reference; architecture and ordered implementation plan.

## First work in the new context

Read AGENTS.md and docs/PLAN.md. Start P01 (typed configuration and contracts), then P02 (safe storage/write-back) and P03 (adapter feasibility). Do not skip to a polished UI before resolving state ownership and execution permissions. Use the included fictional fixtures; real repo pilot imports come later and require explicit selection.

Suggested first prompt:

> Continue promotion-agent from docs/HANDOFF.md. Implement P01 in docs/PLAN.md, preserving the existing legacy compatibility tests. Define and validate the typed configuration and execution contracts, add meaningful tests, and update the plan/handoff with what was verified. Keep this work self-contained in this repo.

## Validation

Run npm test on Node 22.14+. Tests use Node's experimental TypeScript stripping and built-in test runner; no install or credentials are required. Replace this development shortcut with the chosen TypeScript build/typecheck pipeline during P01/P04. Passing these tests does not establish runner, publishing, or UI correctness.

## Integration research references

These were inspected during planning; verify interfaces against the installed versions when implementing P03:

- Codex non-interactive execution: https://learn.chatgpt.com/docs/non-interactive-mode
- Claude Code programmatic execution: https://code.claude.com/docs/en/headless
- OpenCode commands: https://opencode.ai/v2/docs/cli/commands/

Use installed CLI authentication, report missing capabilities honestly, and preserve a prompt-export fallback.

## Remaining release decisions

Check npm/GitHub name availability, confirm license provenance, set supported versions/OS matrix, and perform clean-machine onboarding. The local package is private to prevent accidental npm publication. Remote repository creation and public publication are separate from this local bootstrap.
