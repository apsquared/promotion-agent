# First 10 customers sprint

Use activity `acquisition` for “Help me find my first 10 paying customers. I have 30 minutes a day”, “What should I do today?” for a selected sprint, and sprint results updates. Follow [the shared workflow](../../WORKFLOW.md) for product selection, source/privacy boundaries, tasks, evidence and authorization. This is a persistent execution plan worked in the current conversation, not a guarantee of customers, an outreach bot or a background schedule.

## Define the sprint once

Resolve the product by name and read its sourced context. Check existing `marketing/acquisition/<sprint-UUID>/SPRINT.json` identity/status metadata before creating anything. Resume the current selected sprint; a new chat reads saved records, not remembered progress. If several active sprints fit, ask for a named goal/audience choice. Do not restart merely because a date, offer wording or display name changed. Keep the existing project UUID and generate one stable sprint UUID. If this path is not permitted, return a plan in chat with the persistence limitation; do not silently install a workspace or bypass file gates.

Establish these essentials from known facts and the founder's request; ask only for essential missing choices while preparing independent context:

- **Audience:** a specific role/team, situation and stated problem. Separate observed problems from your hypothesis.
- **Offer:** the sourced product capability, payment terms/price if known, scope and a useful next step. Do not invent a discount, trial, guarantee, testimonial, availability or pricing. An unknown offer can start discovery work; it cannot justify a payment pitch.
- **Time:** minutes per day (30 in this request), project timezone, practical constraints and a review date. Time includes research, reading, drafting, review, permitted action and results logging. No automatic reminder or cadence installation.
- **Customer definition:** the distinct unit (`account` or `person`) and qualifying payment event, such as a successful non-refunded first payment for the stated offer. Record whether existing buyers, renewals, duplicate purchases, test/free accounts, trials, unpaid invoices and cancellations qualify. Define these explicitly rather than quietly counting them.
- **Baseline and target:** save dated paying-customer, trial-user and signup counts separately, each with a source/basis (`verified`, `reported`, `unknown`). Missing is null/unknown, never zero. “First 10” defaults to 10 **total** qualifying paying units including the baseline; “10 more” is an **additional** target. State the interpretation. A baseline already at the target calls for clarification of the next goal, not an invented deficit. Unknown baseline makes total progress unresolved until checked.

Use [SPRINT.json](SPRINT.json) as a fictional record shape, replacing its identity, dates and facts. Keep `customerDefinition`, baseline and target definitions stable across reviews; a substantive definition change requires an explicit founder decision and a dated explanation/reconciliation, not retroactive inflation. Preserve pre-change evidence. Save version snapshots under `versions/vNNN.json` before revising the current record and record those immutable snapshots as task evidence. The current SPRINT.json is a resume index, not an immutable evidence reference.

## Discover a small opportunity set

Reuse [competitor research](../competitor-analysis.md) and the current session's conversation-discovery capabilities. Specialized Reddit/X search skills are optional when available; they do not expand authorization. Start with 1–3 relevant competitors/substitutes and roughly 3–5 original conversations, not a quota of ten threads. Search public audience/problem/product terms only. Open original sources, check identity, date, context and promotion/community rules, and retain URLs, observation times and short sanitized evidence. Snippet-only/inaccessible leads remain unverified and cannot become executable outreach merely from a match.

Research reports can live at their existing permitted paths and be completed under their own criteria. Reference them in the sprint; do not copy their entire contents or equate report completion with customer acquisition. The sprint continues until its paying-customer target is evidenced or the founder stops it. Ten threads, ten drafts, ten replies, ten trials or ten signups never complete the “first ten paying customers” objective.

## Deduplicate and rank with reasons

Keep the wider shortlist and opportunity history in the sprint record, not the task board. Give each opportunity a UUID once; record the original destination URL. The helper canonicalizes Reddit thread/comment variants, X/Twitter status aliases and tracking fragments/parameters for duplicate identity. Several comments in one thread are one opportunity by default. Compare prior sprint records, research reports, canonical URLs and open/done tasks/dispositions before adding a new entry. Cross-posts about the same conversation/person need a manual identity check; generic URL normalization cannot establish that two people are the same. Append a new assessment to an existing opportunity when context changes; retain rejected matches and reasons. A new URL or draft must not silently revive skipped work.

For each assessment, save checked/published dates (unknown publication date is null), source evidence/basis, candidate/excluded decision, estimated minutes for **one next action**, and four scores from 0–2 with independent reasons:

| Dimension | 0 | 1 | 2 |
|---|---|---|---|
| Audience fit | Unknown/outside audience | Plausible overlap | Explicit match to the defined audience |
| Stated problem | No supported problem | Broad relevant question | Concrete problem stated by the author |
| Recency | Unknown/older than 30 days | Visible relevant activity within 30 days | Visible relevant activity within 7 days |
| Useful contribution | No useful/allowed contribution | A relevant question or useful pointer may fit | A specific helpful response fits the context and rules |

Sum these for ordering, never for a purchase probability or buying-intent claim. Explain ties and any preference for an audience/problem match over a busy thread. Recheck recency and contribution before selecting today's work; add a new assessment when it changes. Exclude locked/deleted threads, prohibited promotion, a contribution already made, poor fit or unsupported offers. An older discussion can remain useful research without becoming today's reply target.

## Prepare and queue the next few actions

For the strongest suitable opportunities prepare tailored, helpful replies, discovery questions or a scoped offer for review. Tie each draft to its opportunity, source facts and exact destination. Ask about the author's actual problem instead of pretending to know their intent. Do not pose as an independent customer. State affiliation where relevant, follow community rules and avoid a pitch where only a useful answer is welcome. Discovery can be product-free. Save numbered draft revisions and invalidate earlier approval when text/destination changes.

Use **only the existing project TASKS.md** for executable tasks and its optional registry for skipped/snoozed state. Do not create a sprint TASKS.md, a separate task status field/checkbox queue, or a scheduler. Sprint `taskIds` are references to the existing board; `actions` are historical accounts of actions actually reported/verified, never queued commands. Include the sprint/opportunity UUIDs, original exact URL, draft version, estimate, trigger, self-contained materials and 3–8 Prompt steps in each board task.

Queue or update at most three deduplicated follow-ups under [Keep the work moving](../../WORKFLOW.md#keep-the-work-moving), only the next few actions that fit the daily budget. Prefer one or two useful actions to a backlog. Check the existing board and dispositions first; resume an appropriate open task rather than adding another. Use category `acquisition` for sprint-specific execution/review; existing `competitor` research and `outreach` tasks remain valid. Keep the remaining candidates in the sprint and queue them only when capacity opens. A pending review is executable work, not permission to send. Estimate time realistically; reduce the scope after missed days rather than assigning catch-up spam.

**Leave every reply, DM, email, offer and post unsent until authorized.** A customer-acquisition request or approving the plan authorizes preparation, not sending. Present exact content and destination/account for approval, then recheck target/rules and use available tools within that authorization. Preserve existing exact authorization; a changed version needs fresh review. Record a live receipt/URL/read-back only after the action occurs. If the founder reports sending without a receipt, label it `reported` and leave independent verification unresolved. Publication workflows apply to approved social posts; no new sending integration or credential handling is introduced.

## Resume “What should I do today?”

Read the saved sprint, latest reviews/draft versions, project TASKS.md and the selected registry. Run the read-only helper yourself:

```text
node .promotion-agent/scripts/promotion.mjs acquisition-status --project <workspace> --sprint <UUID> --database <selected-registry>
```

Omit `--database` only when the project has no registry; otherwise find its existing selected registry metadata rather than inventing a new one. The helper warns if dispositions were not supplied and withholds today's suggestions when a requested registry cannot be read. In the maintainer checkout use `node --experimental-strip-types scripts/promotion.mjs`. It validates the saved record, deduplicates outcome units, orders opportunities with saved explanations and reads the current board without writes, reconciliation or external calls. Scores are prior assessments: the agent must recheck them. `selectedTaskId` is the one action to resume, or null for an unqueued candidate. It does not send, queue or prove payment.

Prioritize active queued work that fits today's minutes. Skip done, skipped or snoozed actions; never revive a skip or expired snooze automatically. If a related action is done, only a distinct purposeful follow-up on the existing board can continue that conversation. A meaningful response can justify that follow-up; preserve the original task/action history. Skipped work needs an explicit founder reversal through existing disposition rules, not a replacement task or opportunity UUID. If a registry is unavailable, prepare independent draft/context work and keep disposition-dependent selection pending. Invalid/missing task snapshots never authorize reconciliation/deletion or a new competing queue.

Give a short numbered plan with exact task IDs/draft paths, destination, estimate and required approval. Keep total suggested work within the budget and at most three actions. Save any re-ranking/review decisions, report why other candidates wait, and leave wider research in the sprint. If no useful action fits, state the blocker and queue the smallest fact check/review task where valid. Do not restart onboarding, promise ten customers on a timetable, or count suggestions as actions performed.

## Record results and learn

On a results update, quote/paraphrase only the necessary reported facts, record date/source and classify them separately:

- **Opportunity evidence:** the original discussion/problem and observed context. A match is not an action.
- **Action evidence:** a particular reply/question/offer actually performed, with task/opportunity references and `reported` or `verified` basis. A draft or completed research report is not a sent reply.
- **Outcome evidence:** a distinct pseudonymous customer unit meeting the definition, trial or signup, with its own dated evidence/basis. Do not infer a customer from a positive reply, interest, scheduled call, unpaid invoice or task completion. Minimal sanitized payment confirmation can support `verified`; the helper records an account of that evidence, not an independent payment check.

Keep identities/contact details/credentials/customer records out of routine context and artifacts; use stable pseudonymous keys and private sanitized evidence references. Match a repeated report to its existing customer unit/outcome, never add another sale for the same first-payment unit. Trial → payment can count in both **separate** outcome categories, once in each; it is not two paying customers. Only outcomes new since the baseline enter incremental events. Aggregate snapshots update baseline/dated review with attribution; never append a snapshot total as that many new outcomes. Unknown or conflicting identities/baselines remain unresolved. Outcomes may be unattributed (`opportunityId`/`actionId` null); do not invent acquisition causality.

Append an event with `reported` basis for a founder update lacking confirmation. Later confirmation or retraction uses a new dated event with the same customer key/kind; preserve the prior event and source. The latest event per customer key/kind controls progress, including retractions. A refund/cancellation is reviewed against the saved definition; do not silently discard history or change the goal. Paying, trial and signup counts, reported and verified progress, and total versus additional targets stay separate. A target reached only by reported payments is “reported target reached; verification pending”, never “verified ten customers”. Unknown baseline prevents a verified total claim. An `achieved` flag is not evidence.

Append a dated review with current version, observations, what was learned, confidence/limits and keep/adapt/stop/next-check decision. Increment the plan version for changed audience, offer, workload or strategy; retain failed experiments and previous snapshots. Reconcile only the affected board tasks under existing hash/evidence/disposition rules, with reasons. Completing a research/action task does not complete the sprint. When the actual paying-customer target is verified against its definition, record the supporting outcomes and close/replace only tasks whose criteria are met; wider customer work remains separate. Human-reported task completion follows existing evidence rules, not automatic checkbox changes.

Before ending, save/read back the current sprint and immutable version, record task-linked evidence where appropriate, and take or queue the next useful action. Report opportunity/action/outcome counts with their evidence basis, today's task IDs/minutes, lessons, blocked/skipped decisions and unsent drafts. No automatic outreach, spending, publication, product changes, commit or push.
