# Early-access acceptance record

Run the [manual smoke test](MANUAL-SMOKE-TEST.md) in an existing interactive session. Do not launch nested AI CLIs to simulate native invocation. Keep private paths, transcripts, customer data and drafts out of public results.

| Acceptance gate | Status | Evidence needed |
| --- | --- | --- |
| Codex native menu invocation | Pending | Host version, OS, date, menu discovery and invocation, setup/draft/revision/status result |
| Claude Code native invocation | Pending | Same evidence using /promote |
| OpenCode native invocation | Pending | Same evidence using /promote |
| Outside user’s first draft | Pending | A person new to the project completes setup and reviews a useful draft |

For each trial record the tested commit, Node and host versions, OS, whether setup preserved the source repository, whether records stayed in the separate workspace, missing-tool behavior, draft usefulness, problems and fixes. Use fictional inputs or a sanitized summary. A failed or untested step stays open; do not substitute helper tests for these observations.

An outside-user trial requires an actual participant. No invitations or outreach are implied by this checklist.

## Maintainer fallback walkthrough — 2026-10-12

Completed the [fictional first-draft walkthrough](FIRST-DRAFT.md) in the current Codex session using local helpers directly. Verified reviewed observer installation, unchanged source bytes/directory, two sourced draft versions and task-linked draft records, and an open task with no completion record in the review read model. This provides a visible output example and bounded helper evidence. It does not close any native-menu, name-discovery or outside-user gate above. The exercise used temporary fictional directories; no real product or external account was accessed.
