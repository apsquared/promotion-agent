# Version 1 contracts

`contracts.ts` contains executable runtime schemas; `src/core/contracts.ts` exports inferred TypeScript types and configuration helpers. Call `.parse(unknown)` at trust boundaries. Parsers return a new validated value and throw with a field path on invalid input. They do not coerce values or silently drop unknown fields. These are TypeScript runtime schemas, not JSON Schema documents.

## Ownership and identity

- `Project` is portable repo configuration. The fictional example lives at `examples/example-desk/promotion-agent.json`. Allocate a UUID once during registration; retain it on rename or relocation. Copying configuration for an independent project requires a new UUID.
- `LocalProject` is machine-only registry data keyed by that same UUID: absolute checkout path, preferred agent, and credential references. References name environment variables, never contain their values. Do not commit registry records. `bindProject` rejects a mismatched mapping. P02 must detect duplicate registrations and persist relocation.
- Task identity is project UUID plus the **unchanged** legacy `T-digits` ID. Task content, parser diagnostics, section semantics, and old tasks without Prompt are unchanged. Skipped/snoozed dispositions are local state and cannot mark a Markdown task done or authorize archival.
- `TaskEvidence` is a task-linked, project-local account of a draft or agent-verified completion. It binds the project UUID, task ID and source-task hash. The helper creates a new no-overwrite record file and returns its content hash; it checks local reference bytes on use. These structural checks do not prove an external action occurred.
- v1 is the initial schema; `CONFIG_MIGRATIONS` records its origin. Unknown/missing versions fail closed. There is no prior portable JSON version to migrate. Future version changes need explicit migration functions and tests, separately from P02 database migrations.

## Configuration boundaries

New projects use manual cadence, UTC, draft mode, no allowed writes, and denied commit/push/publication/spending. Non-default action settings express eligibility for later approval, not authorization by themselves. `allowedWritePaths` are literal relative files or directory subtrees; no globs, absolute paths, backslashes, or dot/traversal segments. Execution must resolve real paths, check symlinks and segment boundaries, and enforce isolation before allowing writes. Schema validation alone is not a sandbox.

Validation commands are executable/argument arrays, nullable working directory (null means checkout root), and a positive timeout in seconds. Interactive agents must review executable/configuration trust and preserve argument boundaries; an argument array alone does not make an arbitrary executable safe. Do not put credentials in arguments or product text. Strict objects reject credential/configuration fields in portable data, but cannot identify every secret pasted into free text. Credentials are resolved locally by connectors, never exported into run context.

Cadence is manual, daily, or weekly at `HH:mm` in an IANA timezone, with ISO weekdays 1–7 for weekly cadence. Manual cadence has no time or weekdays; daily cadence has no weekday restriction. Run schedules are draft-only, distinct from external post schedules. Missed runs skip or ask; backlog replay is not allowed. Automatic dispatch and recovery are deferred outside the current interactive scope.

Unknown facts have null values and verification dates. Unverified values stay excluded from claims. Verified facts require source references and a verification timestamp. `verifiedProductFacts` filters eligible facts; it does not establish that a cited source is truthful. No facts are automatically inferred.

## Execution and review

All three agents use one `RunInput`/`RunOutput` contract. Input carries project/run identity, activity, context references, policy, budget, and relative output directory. Output carries artifacts, task proposals, changed paths, evidence, errors, session reference, and nullable usage/cost. Null means unknown, never zero. Artifact revisions are UUIDs and include a content hash; producers must allocate a new revision when content changes. P02/P06 must enforce ID uniqueness in storage.

Run validation rejects inconsistent lifecycle timestamps, cross-project/run artifacts, success without evidence, success containing errors, and failed results without errors. Failed/cancelled runs may retain partial output; failed startup may lack a start timestamp. These checks validate reported structure, not actual execution or factual evidence.

Reviews bind project, artifact ID/revision, intended action, destination, account reference, and intended post time. `reviewMatches` compares the entire binding and requires an approved decision. Any future publishing helper must additionally verify artifact bytes/revision, ownership, provider/account state, and action attempts before dispatch. An approved record alone never sends anything.

The historical AdapterCapabilities and Schedule schemas are retained for P01/P02 compatibility only. The interactive workflow does not populate them, inspect CLI versions/authentication, or dispatch agent runs/schedules. Host tools and permissions remain owned by the active session.

## Validation tooling

The runtime schemas remain dependency-free. `npm test` uses Node 22.14+ TypeScript stripping, while P04 added a pinned TypeScript compiler and `npm run typecheck`. Contract tests do not exercise a publishing integration. P06 integration tests cover local evidence files, optional dispositions and the CLI completion preconditions with fictional inputs.
