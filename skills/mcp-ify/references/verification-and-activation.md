# Verification and activation

## Verify meaningful behavior

Use proportionate tests focused on security boundaries and customer outcomes.

Where relevant, cover:
- SDK initialization, tool discovery, and real tool calls.
- Invalid arguments and bounded outputs.
- Missing, expired, invalid, or revoked credentials.
- Wrong client, audience, user, or tenant.
- Redirect validation and PKCE.
- Code reuse and refresh-token replay behavior.
- Ownership and membership boundaries.
- Protected-information leaks through search and errors.
- Unauthorized writes.
- Concurrent allowance and balance enforcement.
- Retry behavior and duplicate prevention.
- Rollback and external-effect recovery.
- Revocation and permission changes.

Exercise the actual HTTP route and chosen authorization implementation, not only helper functions.

Test the connection UI on desktop and mobile, including sign-in return, consent, copying, errors, and disconnect.

Use isolated fixtures, sandbox providers, and narrowly scoped cleanup. Never require broader production database privileges merely to run tests. Avoid live customer purchases, emails, or other external effects during verification unless explicitly authorized.

Clearly distinguish:
- Mocked authentication.
- A synthetic authenticated browser session.
- A completed real identity-provider login.
- A connection verified in an intended AI client.

One does not prove the others.

## Prepare activation and manual testing

Document the exact configuration required by this repository:
- Public server URL.
- Authorization configuration.
- Secret names, without exposing values.
- Database indexes or migrations.
- Allowed browser origins, if needed.
- Deployment environment.
- Supported clients and known limitations.

Reuse existing deployment conventions. Do not create new provider applications or require new secrets without a concrete need.

Provide a manual test sequence:
1. Open the connections page.
2. Connect from a supported MCP client.
3. Complete sign-in and consent.
4. Perform a harmless read-only check.
5. Exercise a representative workflow.
6. If spending applies, test a small approved operation and its retry.
7. Verify permission or allowance enforcement.
8. Disconnect and confirm access is denied.

For products without spending, adapt the sequence rather than adding artificial budgets.

Report separately what is:
- Implemented.
- Locally verified.
- Verified with real authentication.
- Verified in a target client.
- Configured for deployment.
- Deployed.
- Verified live.

A passing build or SDK test is not proof of hosted-client compatibility or production readiness.
