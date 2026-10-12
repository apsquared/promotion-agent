# Adaptation examples

These are fictional decision exercises, not preselected stacks or live integration evidence. Infer technical answers from the actual repository, then ask only the remaining product questions.

## Read-only analytics SaaS

Request: “Let customers ask an assistant about their analytics.” Repository evidence: existing report/query services, workspace roles, subscription-based report access, no charge per read.

Ask which reports/questions matter first and which clients to support; ask workspace selection only if existing UX does not settle it. Suggest bounded report search, report read, and an account-capabilities check. Reuse report eligibility, tenant isolation, aggregation/privacy thresholds, pagination, and freshness. Test denied reports, cross-workspace queries, and inference leaks through counts and filters.

Use design, authentication/connections, and read-only verification/activation guidance. Skip spending allowances, purchase ledgers, and write idempotency. Do not add artificial budgets. OAuth remains conditional on remote client requirements; read-only does not mean public.

## Credit-based product with paid unlocks

Request: “Allow assistants to find and unlock eligible records.” Repository evidence: redacted search, a credit ledger, purchased entitlements, and an existing unlock service.

Ask which clients, whether unlocks belong in the initial release, and who may approve an allowance, its scope/reset, and interactions among connections. Suggest redacted search, capabilities/balance, and an explicitly charged unlock tool if selected. Never assume a numerical allowance. Keep protected identities out of filters, counts, and errors before purchase. Use opaque references where needed.

Apply all references. Reuse the domain transaction so debit, entitlement, allowance usage, and result stay consistent. Concurrent requests cannot overspend. Retrying an already-owned item should follow existing purchase semantics without another charge. Test balance exhaustion, allowance reduction, duplicate retries, and concurrent unlocks. Skip external-provider recovery only if every effect is database-local; skip unrelated collaboration or messaging controls.

## Multi-tenant collaboration product with writes

Request: “Let assistants create drafts and update team projects.” Repository evidence: organization memberships, project ownership, role checks, and no metered writes.

Ask which writes should ship, which clients connect, and whether authority follows a chosen workspace or the organization if unresolved. Suggest project search/read, draft creation, and a bounded update action. Reuse role/ownership checks on every request; never trust a supplied workspace identifier as proof of membership. Make write access clear at consent, require renewed consent for applicable increases, and apply existing version/conflict handling.

Use design, authentication/connections, and verification/activation guidance, including wrong-tenant denial, membership removal, idempotent creation, concurrent updates, and revocation. Skip spending controls when no quota or paid resource is consumed. If a write also sends notifications, identify the external effect and test recovery with sandbox delivery; permission to edit is not automatically permission to send arbitrary messages.

## Existing MCP server

Request: “Review and improve our current MCP integration.” Repository evidence: an SDK server, existing scopes and connected applications, route tests, and settings UI.

Inspect the implementation and supported-client evidence first. Ask about missing workflows or reported failures and target clients only when unknown. Keep the existing server and reuse contracts where feasible. Prioritize concrete gaps such as per-request membership checks or disconnect that hides a row without revoking credentials. Plan compatibility and migration explicitly for contract changes; do not silently break existing clients.

Use design and verification guidance; load authentication/connections for access or UX changes and spending only for metered effects. Skip new-server scaffolding and unnecessary provider applications, credentials, or a second settings page. For review-only scope, produce source-linked findings rather than implementing a rewrite. Existing tests or a successful SDK call do not prove real sign-in or hosted-client compatibility.

## Review prompts

For each case, check that the proposed response identifies repository evidence before questions, omits inapplicable controls, names actual effects, proceeds to implementation when requested, and labels verification precisely. A user request to deploy still depends on the active authorization and environment; the skill itself grants no external authority.
