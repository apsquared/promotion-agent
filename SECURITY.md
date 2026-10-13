# Security boundaries and reporting

Promotion-agent is early-access software used inside an existing AI agent session. The shared workflow defaults to drafts and a separate private workspace. File helpers check workspace/source separation, reviewed installation plans, symlinks and task revisions. These checks protect helper operations; they are not a sandbox around the agent's other tools. Set host permissions to match the material and actions you authorize.

Local records do not imply local-only AI processing. Your chosen agent/model provider controls processing of text the agent reads. Public search, optional media tools and publishing services receive the inputs sent to them. See [privacy and source handling](docs/PRIVACY.md).

The review desk launcher binds to loopback with a per-session access token. Keep the session URL private. Do not expose the server publicly or assume its local token replaces a hosted authentication system. Task completion and evidence records can document a human or agent account; they do not independently prove that an external action happened.

## Report a vulnerability

Use GitHub's **Report a vulnerability** option on this repository's Security tab if it is available. If private reporting is unavailable, open an issue requesting a private reporting channel, with only a sanitized description of the affected component. Do not put secrets, customer data, private paths, or exploitable details in a public issue. Availability of GitHub private reporting is not asserted by this file.

Provide the tested commit, Node/host versions, affected operation, expected behavior, and a reproduction using fictional files and values. There is no published support/version matrix yet; report against the current source and identify the commit you tested. A passing test suite or dependency audit is evidence about those checks, not a security certification.
