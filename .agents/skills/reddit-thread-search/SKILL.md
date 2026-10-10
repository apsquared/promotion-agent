---
name: reddit-thread-search
description: Find recent Reddit threads worth engaging for marketing, customer discovery, competitor research, founder pain research, and community monitoring. Use when the user asks to search Reddit, find Reddit posts, identify threads to reply to, test Reddit queries, monitor recent Reddit discussions, or build a Reddit search list for a product, category, competitor, or pain point.
---

# Reddit Thread Search

For promotion work, first follow [the shared workflow](../../../templates/WORKFLOW.md). Use the explicitly selected product and its audience to choose queries; the founder/Idea Launch examples below are seeds, not defaults for every product. Keep product repositories read only and save research only in the selected promotion workspace or return it in chat. Research prepares opportunities and draft replies; it does not authorize posting or recurring monitoring.

## Overview

Use targeted Google searches with a past-week filter to find Reddit threads that match live demand, pain, alternatives, or tool-selection conversations. Prefer Google for discovery because it ranks thread-like results better than Reddit search; use Reddit/old Reddit only to inspect individual threads after Google finds them.

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

Prefer:

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
