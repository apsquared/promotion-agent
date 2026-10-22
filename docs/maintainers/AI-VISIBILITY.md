# AI visibility activity — design (proposed P16)

Status: P16a implemented locally on 2026-10-21; live probing not yet exercised. The procedure the agent follows is [templates/activities/ai-visibility/WORKFLOW.md](../../templates/activities/ai-visibility/WORKFLOW.md) with record shapes in [RECORDS.md](../../templates/activities/ai-visibility/RECORDS.md). This document keeps the research, design rationale and decisions; where it and the procedure differ, the procedure wins.

## Goal

Help a registered product get named when people ask ChatGPT, Claude, Gemini, Perplexity, Muse, Google AI Mode and similar assistants a question the product should answer. The practice is usually called GEO (generative engine optimization) or AEO (answer engine optimization).

The unit of success is a **mention in the answer text** for a specific prompt, not a backlink and not a Google rank. Brands appear in AI answer text far more often than they get a citation link (one estimate is about 8×), and Google rankings and AI citations often diverge.

## How assistants decide what to recommend

Assistants recommend from two layers, and each needs a different fix:

| Layer | What it is | How fast it moves | How to influence it |
|---|---|---|---|
| **Memory** (training data) | The internet's long-term opinion of the product, frozen at the model's training cutoff | Only when a new model ships, so months | Be widely and consistently discussed on sites that end up in training data: Reddit, Wikipedia/Wikidata, GitHub, YouTube transcripts, Hacker News, established publications |
| **Retrieval** (live search) | Pages the assistant fetches while answering. ChatGPT searches via Bing; other assistants reportedly use Brave or Google | Days to weeks | Rank for the short searches the assistant runs, be crawlable by its search bot, and appear on the third-party pages it already cites |

Retrieval also uses **query fan-out**: one user prompt becomes several narrower background searches ("best cocktail app" → "AI cocktail recipe from ingredients", "cocktail generator free", ...). Pages that match many fan-out searches are favored. Perplexity and Gemini expose these searches; ChatGPT and Claude mostly hide them.

Both layers share a strong **bias toward earned media over owned media**. The GEO literature describes a "systematic and overwhelming bias toward earned media" (third-party, authoritative sources) over brand-owned content. Ahrefs' study of 75,000 brands found branded web mentions correlated with AI visibility at about 0.66 and backlinks at about 0.22; YouTube mentions (the name in a title, description or transcript) were the strongest factor at about 0.74. These are correlations, not proof of cause, but they agree with the earned-media finding: what other people say about the product matters most.

### Where assistants look

Reddit and Wikipedia are the most-cited domains in every study, but their measured share depends heavily on the dataset and denominator:

| Study | Reddit | Wikipedia |
|---|---|---|
| Ahrefs, 9.6M ChatGPT queries (via review feedback) | ~33% | ~15% |
| ChatGPT top-50 citations, Sept 2026 (via review feedback) | 16.8% | 7.0% |
| Ahrefs Brand Radar, US, July 2026 | 16.7% | 8.9% |
| Profound, ~730k conversations, Oct–Dec 2025 | ~3% | — |
| Outrank, 1,329 citations across ChatGPT, Perplexity, Gemini and Claude, Oct 2026 (forums and social combined) | ~3% | — |

Treat the numbers as directional. For niche and B2B prompts, one study found assistants cited **industry-specific sites** 86% of the time, so a food product should prioritize food and travel publications over generic "best apps" lists. Because the studies disagree this much, the procedure picks plays from the source classes the product's own run cited, not from any study's average.

### Authority, origin and format

A small experiment by Outrank's founder (shared by the user on 2026-10-21; a vendor that sells backlinks and listicle placement, not independently verified) adds three observations:

- **Authority.** The median Ahrefs Domain Rating of the 1,329 cited sources was 86, and only 7% came from sites under DR 30. Assistants cite domains the web already trusts. For a young product this means its own pages will rarely be cited at first, so earned mentions on trusted pages come before site work.
- **Origin.** About 73% of all citations were blog content (listicles, articles, comparisons), but ChatGPT was the exception: only 18% of its citations were blog content and 63% were the original source of a fact, such as a pricing page or documentation. A post that repeats the same statistics as dozens of others has nothing to quote; the page where a fact originates does. This supports making the product's pricing page and docs the primary source for its own facts, and publishing original data (step 7).
- **Interactivity.** Many cited pages had a calculator, chart, table or template. This is the weakest of the three (no rate given, and correlation at best), but it is cheap and fits the click-through reality: the reader who clicks has already read the AI's summary and clicks to do something.

Outrank's conclusion, to build backlinks until DR 30+ and buy placement in cited listicles, is its product pitch. The procedure keeps its existing stance: authority is earned through mentions and links on trusted sites, inclusion in cited listicles is pitched with a real reason, and paid or exchanged links are not the main lever.

### What does not work

- **llms.txt.** Ahrefs found 97% of llms.txt files got no requests in a month; another dataset put it at 0.05% of citations. Coding agents are its main readers, so it is worth a few minutes for developer tools and nothing more.
- **Schema markup on its own**, keyword stuffing (the original GEO paper found it reduced visibility), and fake reviews, bought upvotes or undisclosed Reddit promotion. Removed astroturf also teaches models a negative context for the brand.
- **Assuming Google rank carries over.** It often doesn't.
- **Backlink exchanges** (Outrank-style link swaps) help Google but are not the main lever for assistants; an unlinked mention on Reddit, YouTube or a roundup often counts for more.
- **Hidden text or prompt injection aimed at crawlers.** It risks penalties and is treated as manipulation.

Results take months and compound: once a product is in both the training data and the live sources, it gets recommended even where it doesn't rank first.

## The procedure

One run of activity `visibility` performs a baseline (first run) or a re-measure (later runs), then turns the gaps into ranked, queued tasks. The steps are ordered by return on effort.

### 1. Choose the target prompts

Do not aim for "be recommended". Aim for a fixed set of **20–30 prompts** the product should win, for example:

- TVFoodMaps: "best site to find restaurants from Diners, Drive-Ins and Dives"
- BarGPT: "AI that makes a cocktail from what I have at home"

Cover each buyer intent, because each draws on different sources:

| Intent | Example shape | Sources it tends to draw on |
|---|---|---|
| Category | "best X for Y" | Listicles, roundups, reviews, Reddit |
| Problem | "how do I …" | Guides, docs, tutorials, forums |
| Alternative | "alternatives to [competitor]" | Alternatives pages, AlternativeTo, Reddit |
| Comparison | "A vs B" | Comparison pages, reviews |
| Constraint | "free / open-source / for iPhone …" | Directories, app stores, Reddit |
| Entity | "what is [product]?", "does it cost money?" | Own site, directories, Wikidata, Crunchbase |

Seed wording from the product's marketing context, the competitor activity's report, and real phrasing found with `reddit-thread-search` and `x-post-search`. Tag each prompt with intent, persona and priority. The user approves the prompt set, because it defines the target. Save it as `marketing/ai-visibility/PROMPTS.md` and keep it stable so runs stay comparable; changes are versioned, not overwritten.

### 2. Probe the engines

Ask every prompt in **both modes**:

- **Memory mode:** web search off. Shows the training layer. Record the model name and version, since this layer only changes with model releases.
- **Retrieval mode:** web search on. Record the answer, every cited URL and any exposed fan-out searches.

Answers vary between runs, so measure a **mention rate** (k of N runs per engine), not a single yes/no. Use N = 5 where runs are cheap and at least 2 where the user runs them by hand. Use a logged-out or temporary chat so the consumer app's memory and personalization don't skew the result.

Also run the **entity prompts** ("what is BarGPT?", "how much does TVFoodMaps cost?"). A wrong or stale answer points to a source that needs correcting.

How the probe runs is an adapter choice (see [Probe adapters](#probe-adapters)).

### 3. Collect sources from citations, not from the model's account of itself

Do not ask a model where an answer came from. For memory-mode answers it has no record and will invent plausible sources. Sources come only from:

- citations returned in retrieval mode (the URLs in the answer or in an API's citation fields), and
- the pages that rank for the fan-out searches, checked by searching those queries directly (Bing first, since that is ChatGPT's index).

### 4. Build the citation gap map

For each prompt and engine, record which brands were named (us, each competitor, others) and which URLs were cited. Classify every cited URL:

| Source class | Example | Play |
|---|---|---|
| Owned | The product's own pages | Make them quotable (step 6) |
| Competitor-owned | A competitor's "vs" page | Can't get in; publish our own comparison or alternatives page |
| Editorial roundup | "10 best cocktail apps" | Pitch inclusion with a unique stat or angle; unsent draft |
| Industry publication | Food or travel media | Pitch a story built on proprietary data (step 7) |
| Community | Reddit thread, forum | Helpful participation, disclosed as the maker; `engagement` activity |
| Video | YouTube review or demo | Creator outreach so they use and name it on camera; own video via `video` activity |
| Directory / review | Product Hunt, G2, app stores, AlternativeTo, Crunchbase | Claim or update the listing with the canonical description; `directory` activity |
| Reference | Wikipedia, Wikidata | Wikidata entity if missing; Wikipedia only if genuinely notable, never self-written |
| Open-source list | GitHub awesome-lists | Pull request draft |

The **gap** is every URL that was cited when a competitor was named and we were not. Rank gaps by how many prompts and engines cite them, times prompt priority, times how feasible it is to get in. That ranked list is the outreach plan, saved as `marketing/ai-visibility/<run-date>/GAPS.md` with the raw answers beside it.

### 5. Get mentioned where assistants already look

Turn the top gaps into tasks through the existing activities. No new sending capability is added: pitches, replies and creator outreach are unsent drafts until the user approves each one under the normal review rules.

- **Reddit:** participate helpfully in the subreddits that get cited, disclosed as the maker. Prefer older threads that already rank and get cited.
- **YouTube:** one thorough review video in which a creator uses the product and says its name is worth more than ten blog posts.
- **Listicles and roundups:** pitch the authors of cited "best X" articles with a specific reason to include the product.
- **Directories and reviews:** wherever the category lives, with the description kept identical everywhere.
- **Wikidata and Crunchbase:** a clean entity helps even without a Wikipedia article.

### 6. Make the product's own site quotable

ChatGPT's retrieval has four gates: its search bot can crawl the page, the page matches the short searches it runs, the page has passages it can quote with evidence it can't find elsewhere, and third-party sites it already trusts mention the product. Site work happens in the product repository, so each item becomes a `product` task with a saved proposal; the observed repository stays read only.

- **Crawl access:** allow OAI-SearchBot, ChatGPT-User, Claude-SearchBot and PerplexityBot in robots.txt. Whether to also allow training crawlers (GPTBot, ClaudeBot, Google-Extended) is the user's decision: allowing them is required for future memory-layer inclusion.
- **Bing:** verify the site in Bing Webmaster Tools, submit the sitemap and enable IndexNow. Most sites ignore Bing, and it is ChatGPT's live index.
- **Answer-first pages:** a 2–3 sentence direct answer at the top, then a comparison table, statistics and an FAQ in server-rendered HTML, not behind JavaScript.
- **Primary source:** a public pricing page, docs and changelog with exact figures in server-rendered HTML, so entity prompts are answered from the product's own pages rather than a stale third-party summary.
- **Evidence:** original statistics, expert quotes and citations. The original GEO paper found these raised visibility the most (up to about 40%).
- **Something to do on the page:** a table, checklist, template or small calculator where it genuinely helps the reader.
- **Freshness:** refresh key pages every 8–14 weeks.
- **One identity:** the same name, one-line description and category on the site, schema.org `Organization`/`SoftwareApplication` with `sameAs` links, every directory, social profile, Crunchbase and Wikidata. Contradictions make a model name someone else.
- **Comparison and alternatives pages** for "alternatives to X" and "A vs B" prompts.
- **Fan-out coverage:** one clear page or section for each recurring fan-out sub-question.

### 7. Publish something only the product can be cited for

Proprietary data is the strongest lever for a small product, because nobody else has it and every cited source needs a reason to exist. Examples, with every figure to be confirmed from the product's source before it appears in copy:

- TVFoodMaps: "We mapped 1,400+ TV-featured restaurants: the most-visited show, city and cuisine."
- BarGPT: "10,000 cocktails generated: the most substituted ingredients."

Publish it as a public report page (a `product` or `blog` task), then use it as the hook for roundup pitches, Reddit posts and creator outreach.

### 8. Re-measure

Re-run the same prompt set on a schedule held by a queued task (for example "Not before 2026-11-18"), never a timer. Retrieval changes show within weeks; memory changes only with new model versions. Report per prompt and per engine, never as one blended score:

- mention rate (us and each competitor), position in the answer, and whether the description is accurate;
- share of cited URLs that are earned versus owned;
- gaps closed since the last run, linked to the tasks that targeted them, with the effect labeled "expected" unless a re-measure shows it.

Completing outreach or site tasks never completes the visibility goal; only a re-measure shows movement, and even then correlation with a specific task is not proof that it caused the change.

## Probe adapters

The probe is the one step that needs other AI systems, and AGENTS.md says not to spawn AI CLIs or check provider authentication. The design follows P13's adapter pattern, with a manual default:

| Adapter | How it works | Cost and boundary |
|---|---|---|
| `manual` (default) | The agent writes a probe sheet: each prompt, which engine, which mode, and how to get a clean session. The user runs it in their own apps and pastes the answers and cited links back; the agent parses and records them. | No provider calls or keys. Slow; N is small. |
| `session-search` | The agent runs the prompts and fan-out searches through the session's own search tools and the built-in browser (Bing, plus whatever engine the session's search uses). This shows what ranks and is retrievable, not what any assistant answers. | No AI provider. Always available as a complement to `manual`. |
| `engine-api` (opt-in, needs a scope decision) | The agent calls search-enabled APIs with structured citations under the user's host permissions, using the user's own keys from their environment: OpenAI Responses with web search, Perplexity, Claude with the web search tool, Gemini with grounding (which also returns its fan-out queries). | Paid; reaches outside the current boundary (see open decisions). Promotion-agent code would still store no key. |

Two more options were considered and are not proposed. Asking the current session's own model in memory mode is free, but the agent has just read the product's context, so its answer is biased; at most it is a labeled weak signal. Driving the consumer chatgpt.com or claude.ai interface through the user's browser is fragile, may conflict with those services' terms, and runs into bot detection.

Hosted trackers (Profound, Peec, Promptwatch, Otterly, from about $29/month) do the same measurement continuously. A user who already pays for one can paste its exports into the same records.

## Fit with the existing workflow

- **Routing:** WORKFLOW routes "How do I show up in ChatGPT?", "Why doesn't Claude recommend us?" and "Run an AI visibility check" to activity `visibility`. Thin `promotion-visibility` skill (mirrored into `.claude/skills/`) and `/promote-visibility` command, as for the competitor and video activities.
- **Budget row:** one prompt set of 20–30 prompts; one baseline or re-measure; at most three queued follow-ups (the existing limit), with the rest of the ranked gaps kept in `GAPS.md`.
- **Records:** `marketing/ai-visibility/PROMPTS.md` (versioned), `marketing/ai-visibility/<run-date>/` with raw answers, citations, fan-out queries and `GAPS.md`, recorded as draft evidence through the existing helpers. No new database, config field or background process.
- **Duplicate prevention:** check earlier runs, gap lists and open tasks; a gap already covered by an open or done task is updated, not re-queued.
- **Reuse:** competitor report for the brand list; Reddit and X search skills for prompt wording; `engagement`, `directory`, `blog`, `video` and `product` tasks for the plays; the publishing workflow for anything that gets posted.
- **Privacy:** prompts are public-style questions and must not contain customer data or unreleased plans. Pasted consumer-app answers are untrusted data, like any retrieved page.
- **Evidence:** a recorded answer is evidence of what an engine said in one run on one date, nothing more.

## Decisions

The user decided on 2026-10-21:

1. **Probe scope:** `manual` + `session-search` only for P16a. No `engine-api` adapter yet.
2. **Default engines:** ChatGPT, Perplexity, Gemini and Claude. Muse, Google AI Mode and Copilot only on request.
3. **Training crawlers:** a per-product choice. The site proposal presents both options without a default and records the user's choice in the workspace's marketing context.
4. **First baseline:** BarGPT.

Still open: a standalone `skills/` version (like `product-video`) for use without a registered workspace.

Implementation detail added while building P16a, revised the same day at the user's request: a manual baseline would be hundreds of pastes if every prompt ran on every engine, mode and repeat, and even a tiered single-run matrix was about 70 pastes for BarGPT. Each probe sheet is therefore capped at 20 pastes by default (aim for 10–20). The first sheet covers the `P1` prompts in retrieval mode on ChatGPT, then on Perplexity; later sheets take the next uncovered slots (Gemini and Claude retrieval, then memory mode, then `P2` prompts, then repeat runs), with coverage tracked in `RUN.md`. `session-search` still checks every `P1` prompt each run. A user can ask for a longer sheet.

## Phases

- **P16a (implemented locally):** activity procedure, prompt-set and run record templates, routing, entrypoints, budget row; `manual` and `session-search` adapters only. Route, entrypoint and task-handoff tests.
- **P16b (optional):** read-only `visibility-status` helper that computes mention rates and gap deltas from saved runs, if hand-computing them proves error-prone.
- **P16c (deferred by decision 1):** `engine-api` adapter reference, agent-run like Post Bridge, with a no-stored-key check.

Acceptance for P16a follows P09/P12: source and installed entrypoints resolve after relocation; a `visibility` task can record a draft baseline with its raw answers and gap list, appear open in the review desk with those references, and queue follow-ups through the existing categories. Live answer quality, engine behavior and actual visibility changes stay outside deterministic tests.

## Sources

- Aggarwal et al., GEO paper (KDD 2024), as summarized in [Everything-PR](https://everything-pr.com/we-found-the-paper-that-launched-geo-heres-whats-actually-in-it/)
- [Ahrefs — brand mentions and AI Overview visibility](https://ahrefs.com/blog/ai-overview-brand-correlation/) and the [YouTube rerun summary](https://hartzer.it.com/brand-mentions-in-ai-search/)
- [Ahrefs — most cited domains in ChatGPT](https://ahrefs.com/blog/most-cited-domains-in-chatgpt/)
- [Ahrefs — llms.txt study](https://ahrefs.com/blog/llmstxt-study/) and [Optimizely — does llms.txt work](https://www.optimizely.com/field-notes/articles/does-llms-txt-work/)
- [Peec — query fan-out](https://docs.peec.ai/research/what-is-a-query-fanout) and [Otterly — fan-out](https://help.otterly.ai/query-fan-out-and-how-to-use-it)
- [arXiv 2609.16304 — brand retrieval and ranking in LLM recommendations](https://arxiv.org/pdf/2609.16304) and [arXiv 2606.20065 — GEO at scale](https://arxiv.org/pdf/2606.20065)
- [Search Engine Land — GEO in 2026](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142)
- [Frase — AI visibility tools compared](https://frase.io/blog/the-10-best-ai-visibility-tools-in-2026)
- Review feedback supplied by the user on 2026-10-21: the two-layer model, the earned-media quote, the ROI ordering, the 9.6M-query and Sept 2026 citation shares, the 86% industry-site and 8× mention figures, the four gates, the 8–14 week refresh and the TVFoodMaps/BarGPT examples. These were not independently verified.
- Outrank founder's AEO experiment, shared by the user on 2026-10-21: 1,329 citations, median DR 86, 7% under DR 30, the 73%/7%/3% format split, ChatGPT's 63% original-source share, and the interactivity observation. Vendor data; not independently verified.

Most quantitative claims in this space come from vendors selling GEO tools. The consistent qualitative findings (earned mentions, identical entity data, quotable evidence, retrieval via the engines' search indexes) are more reliable than any single number.
