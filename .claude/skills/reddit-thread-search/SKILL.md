---
name: reddit-thread-search
description: Find recent Reddit threads, and older threads that rank on Google's first page, worth engaging for marketing, customer discovery, competitor research, founder pain research, and community monitoring. Use when the user asks to search Reddit, find Reddit posts, identify threads to reply to, find Reddit threads that rank on Google or get cited in AI answers, test Reddit queries, monitor recent Reddit discussions, or build a Reddit search list for a product, category, competitor, or pain point.
---

# Reddit Thread Search

For promotion work, first follow [the shared workflow](../../../templates/WORKFLOW.md). Use the explicitly selected product and its audience to choose queries; the founder/Idea Launch examples below are seeds, not defaults for every product. Keep product repositories read only and save research only in the selected promotion workspace or return it in chat. Research prepares opportunities and draft replies; it does not authorize posting or recurring monitoring. Before any reply or post drafted for a subreddit goes to the user, run [the Reddit post check](../../../templates/activities/reddit-post-check.md).

## Overview

Use targeted Google searches to find Reddit threads that match live demand, pain, alternatives, or tool-selection conversations. Prefer Google for discovery because it ranks thread-like results better than Reddit search; use Reddit/old Reddit only to inspect individual threads after Google finds them.

There are two passes, reported separately:

- **Recent pass** (the default, below): a past-week filter finds new conversations while the poster is still reading replies.
- **Evergreen pass** (see [Evergreen Pass](#evergreen-pass-google-ranked-threads)): no date filter, keeping only threads already on Google's first page. These are often months old but keep drawing searchers, and AI answers often cite them, so one useful reply keeps being read. Run it when the user asks for threads that rank on Google or get cited by AI, for evergreen or SEO opportunities, or for a full search for a product. Skip it when the user asks only for recent threads.

For a larger query bank, read [references/search-topics.md](references/search-topics.md).

## Fast Workflow

1. Choose 3-8 test queries from these patterns:
   - `best [category] reddit`
   - `[competitor] alternatives reddit`
   - `what do you use for [job/pain] reddit`
   - `how do I [desired outcome] reddit`
   - `[platform/tool] too complicated reddit`
   - `I built [thing] and [bad outcome] reddit`

2. Search Google in Chrome with the past-week filter:
   - Use `https://www.google.com/search?q=<encoded-query>&tbs=qdr:w`
   - Keep the literal word `reddit` in the query.
   - Use the Chrome extension when the user explicitly asks for Chrome or wants authenticated/profile-dependent browsing.

3. Extract Reddit post links from the Google result DOM:
   - Keep URLs matching `reddit.com/r/<subreddit>/comments/...`.
   - Ignore subreddit homepages, user profiles, comment anchors unless they point to a useful answer, sponsored results, and non-Reddit links.
   - Deduplicate normalized post URLs by stripping fragments and comment-specific suffixes unless the comment itself is the target.

4. Score each result quickly:
   - **Strong fit**: thread asks how to solve the exact problem, compares tools, complains about DIY complexity, asks where to get users, or reports a failed attempt.
   - **Medium fit**: adjacent founder/product/marketing pain but not directly asking for the product category.
   - **Weak fit**: promotional posts, generic lists, unrelated ad operations, or threads where the audience is not the buyer.

5. Return concise, actionable output:
   - Query tested.
   - Best 2-5 thread links per query.
   - One-line reason each thread matters.
   - Best query and best thread to prioritize.

## Evergreen Pass (Google-Ranked Threads)

1. Choose 3-6 buying-intent queries, the searches a buyer types before choosing (seeds in [references/search-topics.md](references/search-topics.md#evergreen-google-ranked-queries)):
   - `best [category] reddit`
   - `best [category] for [audience] reddit`
   - `[competitor] alternatives reddit`
   - `[competitor] vs [competitor] reddit`
   - `what do you use for [job] reddit`

2. Search Google without a date filter: `https://www.google.com/search?q=<encoded-query>` (no `tbs`). Keep the literal word `reddit`.

3. Keep only Reddit thread URLs on Google's first page, and record for each one:
   - the query, its position among the organic results (skip ads and the AI overview), and the date checked;
   - whether it also or only appears in a "Discussions and forums" block.
   The position is what this browser session showed. Google results vary by location and person, so call it the position seen on that date, not a tracked ranking, and never turn it into a traffic estimate.

4. Open each kept thread on Reddit, or ask the user to open it and paste the post and top replies when Reddit cannot be read. Check:
   - **It can still take a comment.** Reddit archives older posts (after six months by default, though moderators can turn that off) and moderators can lock any thread. An archived or locked thread is weak however well it ranks.
   - **What is already said.** Read the top replies. A reply is worth drafting only when it adds something missing: a newer option, a correction, a specific use case or a comparison nobody made.
   - **Date and activity.** Note the thread's age and comment count from the page itself. Snippet dates are discovery aids, not facts.
   A thread that could not be opened goes in an unverified list and gets no draft.

5. Score each evergreen thread:
   - **Strong fit**: open for comments, the question asks for what the product does, it ranks in the top five, and the existing replies leave a gap the product's honest answer fills.
   - **Medium fit**: open and relevant, but lower on the page, already well answered, or only next to the buyer's question.
   - **Weak fit**: archived or locked, off-audience, or full of vendor replies already.

6. Deduplicate against the recent pass, earlier reports, open and done tasks, and skipped or snoozed threads. A thread the user has already replied to counts as covered unless something meaningful has changed.

Ranking changes what is worth answering, not how. Draft at most one reply per thread, from the user's own account, answering the question first and disclosing the user's connection to the product. Never suggest upvotes, asking others to vote, a second account, or a reply that exists only because the thread ranks. Run [the Reddit post check](../../../templates/activities/reddit-post-check.md) on every draft, as for any Reddit reply.

## Chrome Pattern

When using the Chrome skill, use this approach:

```js
const queries = [
  "best way to validate a saas idea reddit",
  "what do indie hackers use to validate ideas reddit",
  "facebook ads for startup validation reddit"
];

for (const q of queries) {
  const url = "https://www.google.com/search?" +
    new URLSearchParams({ q, tbs: "qdr:w" }).toString();
  await tab.goto(url);
  await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 20000 }).catch(() => {});
  await tab.playwright.waitForTimeout(2000);
  const snapshot = await tab.playwright.domSnapshot();
  // Parse link lines with reddit.com/r/.../comments/... URLs.
}
```

If link enumeration is slow, use `domSnapshot()` and parse `link` blocks plus following `/url:` lines. Reddit search sorted by newest is often too broad and can surface unrelated fresh posts; prefer Google `tbs=qdr:w` for quality.

## Query Selection

Start with queries that capture intent, not just category names:

- Validation: `best way to validate a saas idea reddit`
- User acquisition: `where do you get first users reddit`
- Tool choice: `what do indie hackers use to validate ideas reddit`
- Alternatives: `[competitor] alternatives reddit`
- Setup friction: `facebook ads too complicated reddit`
- Failure: `I built an app and nobody uses it reddit`
- Decision pressure: `too many ideas which one to build reddit`

For Idea Launch specifically, prioritize indie founders, SaaS builders, vibe coders, app builders, micro-SaaS, SideProject, Entrepreneur, startups, and indiehackers threads. Avoid over-indexing on marketer-only ad-ops threads unless the user wants paid-media research.

## Result Quality Rules

Prefer (the evergreen pass has its own scoring above):

- Recent threads with comments, especially 5+ comments.
- Posts where the original poster asks for help, tools, frameworks, or examples.
- Threads about validating before building, finding first users, waitlists, landing pages, ad tests, or deciding what to build.
- Posts showing emotional pain: wasted months, no users, confusing ads setup, no signal, too many ideas, or failed launch.

Deprioritize:

- Pure self-promotion with no discussion.
- Threads about unrelated business models.
- Broad marketing advice where validation is not the problem.
- Technical ad-ops threads that would attract agencies rather than founders.

## Output Template

```markdown
Tested with Google past-week search.

**Query: `<query>`**
- [Thread title](https://www.reddit.com/r/...): strong fit because ...
- [Thread title](https://www.reddit.com/r/...): medium fit because ...

Best query: `<query>`
Best thread to prioritize: [Thread title](https://www.reddit.com/r/...)
```

When the evergreen pass ran, add:

```markdown
Evergreen: Google first page, no date filter, checked YYYY-MM-DD.

**Query: `<query>`**
- #<position> [Thread title](https://www.reddit.com/r/...) (r/<subreddit>, <age>, <n> comments, open | archived | locked): strong fit because ... Gap in existing replies: ...

Unverified (could not be opened): [Thread title](https://www.reddit.com/r/...)

Best evergreen thread: [Thread title](https://www.reddit.com/r/...)
```
