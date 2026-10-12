# Authentication and connection experience

## Choose authentication for the intended clients

For remote customer connections, prefer browser-based OAuth authorization when supported by the target clients.

First determine whether the existing identity provider or authorization platform can securely support the needed flow. Prefer mature authorization infrastructure and libraries.

An application's existing Google login or website session does not automatically make it an OAuth authorization server for MCP clients.

Verify and implement the relevant requirements, including:
- Authorization-code flow and PKCE.
- Protected-resource and authorization-server discovery.
- Resource/audience binding.
- Exact redirect validation.
- The client-registration methods the intended clients support.
- Appropriate public or confidential client authentication.
- Scoped credentials.
- Token expiry, refresh, revocation, and replay handling.

Do not assume dynamic client registration alone works with every client. Check compatibility before claiming support.

If another connection method is appropriate—for example local stdio, service accounts, or scoped API credentials—explain the tradeoff and implement secure provisioning and storage.

Never ask customers to paste their password, session cookie, or private credentials into an assistant conversation.

For a custom credential store, use strong random credentials and avoid storing recoverable bearer secrets when hashing is sufficient. Keep credentials out of logs and UI.

Use explicitly configured public URLs. Do not construct security-sensitive metadata from untrusted request headers. Account for trusted proxies, preview hosts, HTTPS, origins, request-size limits, rate limits, and framework behavior.

Test real browser sign-in and consent behavior, including return URLs, CSRF protections, referrer policies, and overlapping security headers.

## Make connection setup easy

Use the SaaS's existing design system and account navigation.

Provide an appropriate connections or integrations page with:
- The canonical MCP server URL.
- A copy button.
- Brief instructions for supported clients.
- A short, copyable setup prompt.
- Connected application details.
- Permissions and applicable allowances.
- Relevant usage information.
- A clear disconnect control.

The setup prompt should be generated from the actual configuration. Use wording like:

“Connect my [Product] account to this assistant using the MCP server at [URL] with OAuth. Set it up if you can, or guide me through your connection settings. Let me sign in and approve access. Then verify the connection using a read-only account check without spending credits or making changes.”

Adapt this to the product's authentication and capabilities.

Do not promise that every assistant can configure its own connections. Provide a guided fallback.

The consent screen should explain requested access and effects in ordinary product language. Default to the least privilege that supports the chosen workflow. Make optional write or spending access explicit when applicable.

Distinguish self-reported application names from verified provider identity.

Do not display credentials unnecessarily. Make copying accessible and provide a manual-selection fallback when clipboard access fails.

Permission increases may require renewed consent. Disconnect must invalidate access according to the documented revocation behavior, not merely hide the connection from the UI.
