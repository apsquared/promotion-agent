# AI visibility records

File shapes for the [AI visibility activity](WORKFLOW.md). All files live in the promotion workspace, never in the product repository. Examples use the fictional Example Desk product.

```text
marketing/ai-visibility/
  PROMPTS.md                  current prompt set (versioned in place; see below)
  2026-11-02/
    PROBE-SHEET.md            sheet 1 the user runs by hand (at most 20 pastes)
    PROBE-SHEET-2.md          later sheets, each taking the next uncovered slots
    raw/                      the user's pasted answers, unedited
    RUN.md                    recorded results
    GAPS.md                   ranked citation gap map
```

A second run on the same date uses a suffix (`2026-11-02-2`). Run folders are never rewritten after their results are recorded; corrections go in a dated note at the end of `RUN.md`.

## PROMPTS.md

Each version is a section. Add a new version above the old ones; never edit a version a run has used.

```markdown
# AI visibility prompt set — Example Desk

## Version 1 — approved 2026-11-02

Engines: ChatGPT, Perplexity, Gemini, Claude
Tracked brands: Note Harbor, Desk Pilot, Paper Trail
Approved by the user in conversation on 2026-11-02.

| ID | Priority | Intent | Persona | Prompt |
|---|---|---|---|---|
| Q01 | P1 | Category | Solo founder | What's the best simple task board for a one-person startup? |
| Q02 | P1 | Alternative | Small team lead | What are good alternatives to Note Harbor? |
| Q03 | P2 | Constraint | Student | Is there a free kanban app that works offline? |
| Q04 | P1 | Entity | Any | What is Example Desk? |
```

## PROBE-SHEET.md

```markdown
# Probe sheet — Example Desk — 2026-11-02

Prompt set version 1. Sheet 1 of the baseline. Total pastes: 18 (default maximum 20).

How to run each one:
- Use a logged-out or temporary chat.
- Retrieval = web search on. Memory = web search off (skip where it can't be turned off).
- Paste the full answer and its sources/cited links, labeled like `Q01 · ChatGPT · retrieval`.

## ChatGPT (9)
- [ ] Q01 · retrieval — What's the best simple task board for a one-person startup?
...

## Perplexity (9)
- [ ] Q01 · retrieval — What's the best simple task board for a one-person startup?
...
```

Later sheets reuse the same shape (`PROBE-SHEET-2.md`, `PROBE-SHEET-3.md`, ...), each taking the next uncovered slots.

## RUN.md

```markdown
# AI visibility run — Example Desk — 2026-11-02

Prompt set version 1. Adapters: manual, session-search.
Coverage: sheet 1 complete (18 of 18 pastes).

| Slot | Done | Remaining |
|---|---|---|
| P1 retrieval · ChatGPT | 9 of 9 | — |
| P1 retrieval · Perplexity | 9 of 9 | — |
| P1 retrieval · Gemini, Claude | — | next sheet |
| P1 memory · ChatGPT, Claude | — | later |
| P2 retrieval · ChatGPT | — | later |

## Results

| Prompt | Engine | Mode | Run | Adapter | Model | Named (in order) | Us? | Position | Accurate? | Cited URLs | Fan-out |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Q01 | ChatGPT | retrieval | 1 | manual | shown model name | Note Harbor, Desk Pilot | no | — | — | https://example.org/best-task-boards | — |

## Mention rates

| Prompt | Engine | Mode | Example Desk | Note Harbor | Desk Pilot |
|---|---|---|---|---|---|
| Q01 | ChatGPT | retrieval | 0 of 2 | 2 of 2 | 1 of 2 |

## Retrieval candidates (session-search)

| Query | Source | Top results (class) | Us? | Competitors |
|---|---|---|---|---|
| best simple task board solo founder | Bing | https://example.org/best-task-boards (editorial) ... | no | Note Harbor |

## Site readiness

robots.txt: search bots allowed / blocked ...; training crawlers ...; server-rendered content ...; sitemap ...; Bing `site:` ...

## Entity facts

| Prompt | Engine | Wrong or stale fact | Cited source |
|---|---|---|---|

## Limits

Small samples, engines or modes not covered, blocked tools.
```

## GAPS.md

```markdown
# Citation gap map — Example Desk — 2026-11-02

| Rank | URL | Class | Cited for | Engines | Competitors named | Feasibility | Play | Task |
|---|---|---|---|---|---|---|---|---|
| 1 | https://example.org/best-task-boards | Editorial roundup | Q01, Q03 | ChatGPT, Perplexity | Note Harbor, Desk Pilot | Medium: author accepts suggestions | Inclusion pitch | T-031 |
| 2 | https://www.reddit.com/r/example/comments/... | Community | Q02 | ChatGPT | Note Harbor | High | Disclosed reply | not queued |

Not queued yet: reasons per row (budget, skipped, waiting on a fact).
```
