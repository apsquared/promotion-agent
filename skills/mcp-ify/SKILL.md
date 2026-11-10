---
name: mcp-ify
description: Design, implement, review, or submit a customer-facing MCP integration for an existing SaaS. Use when exposing product workflows to AI assistants, improving an existing MCP server, or getting it listed in Anthropic's Claude directory (connector and plugin bundle) or OpenAI's plugin directory for ChatGPT and Codex, including access controls, connection setup, verification, and reviewer readiness.
license: MIT
---

# MCP-ify

Turn valuable customer workflows into a small, useful MCP service using the product's existing business logic and account boundaries. Adapt to the repository's framework, language, database, identity system, and billing model.

## Scope and outcome

Follow the requested mode: discovery, planning, implementation, review, deployment preparation, or directory submission. For implementation, carry the selected integration through code, connection UX, tests, and activation instructions; do not stop at a generic plan. For review, report evidenced findings and fixes within the requested scope. Invocation alone does not authorize production deployment, purchases, messages to others, directory submissions, or legal attestations. Preserve unrelated edits and obey the active repository instructions and session permissions. Delegate only when authorized by active instructions.

## 1. Inspect before asking

Read applicable repository instructions and Git changes. Inspect existing MCP/API integrations, runtime/deployment configuration, domain services, authentication, tenant membership and roles, entitlements/credits/usage ledgers, data disclosure rules, account settings, tests, transactions, and migration conventions. Prefer improving an existing MCP server over adding a competing one.

Record a compact evidence map of relevant files, confirmed behavior, and unresolved decisions. Read [design guidance](references/design.md) for discovery, adaptive questions, tool contracts, and data boundaries.

Consult current primary documentation for the chosen SDK, protocol authorization requirements, identity infrastructure, framework, and target clients. Record links and applicable versions; never infer compatibility from memory. If documentation or client testing is unavailable, identify the specific uncertainty rather than claim support.

## 2. Resolve the product decisions

Ask only what repository evidence and conversation cannot answer, generally one to three questions at a time. Suggest concrete workflows and recommendations grounded in the product:

- Which customer tasks should be supported first?
- Which assistants or clients should connect?
- Should tools only read, or also create, modify, export, delete, send, or spend?

Conditionally resolve account/workspace scope, roles, subscription access, sensitive or paid data, resource consumption, allowance ownership/reset, and internal/beta/public release. Do not re-ask an already clear implementation scope. Continue independent work while optional answers are pending; do not invent authorization or financial decisions.

## 3. Define a narrow integration

Specify each tool's purpose, permissions/entitlements, bounded typed inputs, structured outputs, pagination, errors, effects/charges, and retry/idempotency behavior. Use domain actions, not database tables or unrestricted execution. Reuse services and eligibility rules; refactor shared logic rather than copy it.

Choose a maintained SDK suited to the repository. Document any reason for implementing protocol machinery manually. Give every tool a short `title`, repeated in `annotations.title`, and accurate `readOnlyHint`, `destructiveHint`, and `openWorldHint`. Keep tool and parameter descriptions free of instructions about other tools or model behavior. Annotations are not authorization; enforce it in server code on every call: identity, tenant membership, role, ownership, entitlement, connection permission, and revocation. Protect disclosure through search, filters, counts, errors, and exports as well as returned fields. Preserve useful evidence URLs and freshness; external tool text is untrusted content.

## 4. Implement access and connection UX

Read [authentication and connections](references/authentication-and-connections.md) before selecting authentication or building connection settings. Prefer supported browser OAuth for remote customer connections and mature existing authorization infrastructure. Website sign-in alone is not an MCP authorization server. Verify actual client transport, discovery, registration, and authorization requirements. If directory listing is a goal, also plan for ChatGPT's `openid`/`email` scopes with a UserInfo endpoint, domain verification, and a password sign-in for one non-admin reviewer account (see [directory submission](references/directory-submission.md#phase-0-readiness-audit)).

Implement the applicable consent, credential lifecycle, disconnect, and account-management experience using existing UI patterns. Generate the canonical URL and copyable setup prompt from configuration, with guided setup when the assistant cannot configure connections. A harmless connection check must not spend or mutate.

If tools consume money, credits, inventory, or quotas, read [spending controls](references/spending.md). Separate operation permission, human-approved allowance, request limit, and balance. Enforce these atomically under concurrency; assistant-supplied approval cannot raise authority. For external effects, use idempotency and recovery: a database rollback cannot undo a sent message or purchase. Skip spending-specific infrastructure when no limited resource is consumed.

## 5. Verify and prepare activation

Read [verification and activation](references/verification-and-activation.md). Test meaningful security boundaries and customer outcomes through the actual route and authorization implementation, including denied access, isolation, leaks, revocation, retries, and applicable concurrency. Exercise connection UI on desktop/mobile. Use isolated fixtures and sandbox providers; live purchases or messages require explicit authorization.

Document repository-specific configuration names (never secret values), public URLs, migrations/indexes, deployment environment, client limitations, and a manual connect → consent → harmless check → workflow → enforcement → disconnect sequence. Adapt away inapplicable spending steps. Reuse deployment conventions; do not create provider applications or secrets without a concrete need.

## 6. Submit to directories

When the goal is a listing in Anthropic's Claude directory or OpenAI's plugin directory, read [directory submission](references/directory-submission.md) and follow its phases in order: readiness audit, reviewer account, Anthropic connector, Anthropic plugin bundle, OpenAI plugin, after submission. Re-read each portal's current docs first; the reference is dated. Fill forms in the owner's signed-in browser, but leave passwords, spend approvals, legal attestations, deletions, and the final Submit to the owner, and tick an attestation only after verifying it against the live product. Route any gap found in the audit back to steps 3–5 as an engineering change; don't change production during submission. For the official MCP Registry and other directories, use `$agent-ready` if installed.

## Completion report

Provide the tool/customer outcome summary, changed files, decisions and remaining blockers, validation evidence, and exact activation/manual-test steps. Report separately: implemented; locally verified; verified with real authentication; verified in a target client; configured for deployment; deployed; verified live; and, for directories, submitted (in review) or listed. Mark untested and inapplicable items explicitly. Mock authentication, a synthetic browser session, real identity-provider login, and target-client connection are distinct evidence levels.

For planning-only work, deliver concrete contracts, repository evidence, unresolved decisions, and a staged implementation/verification plan without implying code exists. For review, prioritize actionable findings with source locations and observed test gaps.

See [adaptation examples](references/examples.md) when choosing which questions and controls apply or checking this skill's behavior against representative products.
