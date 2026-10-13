# Launch pack record

Copy into the permitted workspace release directory and replace placeholders with sourced facts. This is private review metadata; only clean approved copy goes to public destinations.

## Identity and scope

- Project ID: <existing workspace project UUID>
- Release ID: <new UUID; preserved for revisions>
- Created at: <UTC timestamp>
- Request: <founder wording>
- Window: <absolute dates, project timezone and UTC offset; stated assumptions>
- Source kind: <git | changelog>
- Source snapshot: sources.json
- Base commit: <full ID, excluded; or unavailable with reason>
- Head commit: <full ID, included; or unavailable with reason>
- Included commits: <all full IDs from sources.json; no ellipsis>
- Changelog: <reference, section/version, SHA-256; if used>
- Scope limits: <uncommitted work excluded, omitted paths/counts, missing evidence>
- Previous packs: <release/claim IDs and duplicate/availability-update decisions>

## Sources and claims

| Claim ID | Customer benefit and inference limits | Implementation class/status | Exact change/doc reference + supporting excerpt | Deployment status + evidence reference | Environment, audience, limits, verified at | Prior pack/claim | Draft sentences/scenes |
|---|---|---|---|---|---|---|---|
| C-001 | <supported benefit> | <customer-change/internal-only/unclear; implemented?> | <full commit + path + symbol/lines OR changelog hash/section; sanitized excerpt> | <confirmed/undeployed/unknown; checked live result/receipt or attributed founder fact> | <scope + UTC time> | <ID or none checked> | <version + output/scene> |

## Unresolved facts

| Fact | Why unresolved | Next verification step | Task ID |
|---|---|---|---|
| <fact> | <missing/conflicting evidence> | <small concrete check; no deployment implied> | <T-NNN> |

## Versions and lifecycle

| Version | Immutable draft file | Source snapshot | Review status | X / release notes / explanation statuses | Video status | Approval reference, exact destinations/time | Task IDs |
|---|---|---|---|---|---|---|---|
| v001 | versions/v001.md | sources.json | draft | draft / draft / draft | storyboard | none | <T-NNN> |

## Deployment and action history

Append dated evidence, status transitions, revised claim decisions and actual receipts/live URLs. Link new source scope to a new release UUID. Do not replace prior evidence or equate approved/scheduled with published. When copy changes, explicitly invalidate its prior approval.

## Draft version shape

Each versions/vNNN.md contains these four sections together:

1. X announcement — clean copy, then private claim mapping.
2. Short release notes — clean copy, then private claim mapping.
3. Customer-facing explanation — clean copy and sourced steps/limits, then private claim mapping.
4. Demo storyboard — scene timing, on-screen text, action/capture target, visible payoff, capture status and claim IDs.

Withhold unsupported availability copy in each section and link the unresolved fact. A storyboard is preparation, not a render or proof of live behavior.
