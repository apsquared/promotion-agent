# Documentation

promotion-agent documentation serves two audiences, and a document's folder says which one it is for.

## Audiences

**Agent users** are people who use promotion-agent to promote their own products: setting up a product, drafting and revising marketing work, checking status and using the review desk. This includes the AI agent acting for them in their Codex, Claude Code or OpenCode session, which reads some of these docs (such as the helper reference) while doing the work. Agent users never need to change promotion-agent's source.

**Agent maintainers** are people, and coding agents, who develop promotion-agent itself: changing its workflow, helpers, review desk or packaging, and running its tests, releases and acceptance checks.

The test for where a document belongs: if an agent user would need it without ever editing promotion-agent's source, it is user documentation. Everything else is maintainer documentation.

User documentation lives directly in `docs/` and ships in each installed promotion workspace under `.promotion-agent/docs/`. Maintainer documentation lives in `docs/maintainers/` and does not ship. User docs must not link into `docs/maintainers/`, because those links would break in installed workspaces.

## For agent users

- [Using promotion-agent](USING.md): setup, everyday requests, upgrades and boundaries.
- [Review desk](REVIEW-UI.md): the optional local task board.
- [Compatibility](COMPATIBILITY.md): how to invoke it in each agent host, and supported platforms.
- [Helper reference](HELPERS.md): local helper commands, run by the agent in your session.
- [Privacy and source handling](PRIVACY.md): what the agent reads, sends out and keeps private.

The [shared workflow](../templates/WORKFLOW.md) the agent follows lives in `templates/`.

## For agent maintainers

Start with [AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

- [Plan](maintainers/PLAN.md): implementation sequence and milestone status.
- [Handoff](maintainers/HANDOFF.md): change log and where to continue.
- [Architecture](maintainers/ARCHITECTURE.md): design decisions.
- [Storage](maintainers/STORAGE.md): SQLite registry, write-back and legacy APIs.
- [Review desk internals](maintainers/REVIEW-DESK.md): code layout, security and verification.
- [Release checklist](maintainers/RELEASE.md): distribution status, remaining gates and compatibility evidence.
- [Acceptance record](maintainers/ACCEPTANCE.md), [manual smoke test](maintainers/MANUAL-SMOKE-TEST.md) and [first-draft walkthrough](maintainers/FIRST-DRAFT.md).
- [History](maintainers/history/): the original extraction record and the P05 verification.
