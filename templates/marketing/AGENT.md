# Marketing context — <PRODUCT NAME>

## Product and verified facts

Describe the product, audience, site URL, and actual capabilities. List canonical repo documents. For metrics and claims record a source and verification date; do not guess missing facts.

## Audience and voice

Audience: <who benefits>
Voice: <specific, useful, conversational>
Categories: <rotate tips, lessons, questions, product examples>
Avoid fabricated testimonials, repetitive openings, empty hype, and unsupported comparisons.

## Channels and cadence

Enabled activities: <social, directory, engagement, blog, pseo, competitor, video, release, acquisition>
Timezone: <IANA timezone>
Cadence and per-run budgets: <explicit limits>
Publishing account references: <optional non-secret handles; scheduler adapter and provider account IDs live in promotion-agent.json `scheduler`, never credentials>
Shared-account restrictions: <if any>
Default: prepare drafts; no external publication, commit, or push.

## Content locations and validation

Allowed paths: <explicit promotion-workspace-relative paths; product repository is read only>
Content system: <file formats or configured adapter>
Validation commands: <configured argument arrays; do not assume npm>
Deployment behavior: <record if a push or content mutation deploys publicly>

## Competitor research

Known competitors: <names and official URLs, or unknown>
Audience/use-case overlap: <why each is comparable; distinguish direct and adjacent products>
Research scope: <optional communities, languages, date range, excluded brands>
Prior competitor reports: <existing permitted report paths, if any>

## Media

Existing assets and approved generation workflow: <paths and instructions>
Video projects: <paths under marketing/assets/videos/, their renders, and the approved sources for on-screen copy and narration>

## Acquisition sprints

Sprint records: <permitted workspace path, normally marketing/acquisition/<sprint-UUID>/SPRINT.json; existing project UUID, customer definition, audience, offer, daily minutes, baseline/target, opportunity/action/outcome history and dated reviews>
Executable actions: <references to the existing project TASKS.md and selected registry; no sprint task board>
Outcome evidence: <minimal sanitized references; distinguish paying customers, trials and signups, reported and verified; never store credentials or private customer records>

## Releases

Launch packs: <permitted workspace path, normally marketing/releases/<release-UUID>/; project UUID, frozen source IDs, claim table, deployment evidence/unknowns, draft versions, statuses and task references>
Availability evidence: <environment/audience/rollout limits and dated sources; a merged commit alone is insufficient>

## Seasonal opportunities

| Window | Topic | Activity | Lead time |
|---|---|---|---|

## Product-specific rules

Record legal/editorial constraints, prohibited claims, approval policy, and exceptions explicitly. Product-specific marketing overrides remain owned by this promotion workspace during template upgrades.
