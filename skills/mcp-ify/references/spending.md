# Spending and limited resources

## Separate permissions from spending authority

Apply this section only when tools consume paid or limited resources.

A scope authorizing an operation does not by itself authorize unlimited spending.

Design separately:
1. Permission to perform the operation.
2. The user's approved ongoing allowance.
3. A bounded limit for the individual request, when useful.
4. The account's available balance or quota.

Human-approved account settings are authoritative. Chat text, an assistant-supplied approval flag, or a tool description must not increase a user's spending authority.

Define what the allowance measures, where it applies, when it resets, and how multiple connections interact. Make this clear in the UI.

Enforce balance, allowance, eligibility, and permissions under concurrency.

For database-local operations, use appropriate transactions or conditional writes so the debit, entitlement, usage record, and business change remain consistent.

For external effects, use provider idempotency support and suitable recovery patterns. Do not claim that a database rollback undoes an external purchase, message, or API action.

Design idempotency for the actual workflow. Purchasing an already-owned item may naturally be free on retry; creating a new resource may require an idempotency key and a stored result.

Handle insufficient balance, partial failures, concurrent requests, disconnects, and allowance changes without double charging or exceeding limits.
