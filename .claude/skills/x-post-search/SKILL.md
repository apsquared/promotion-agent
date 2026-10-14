---
name: x-post-search
description: Find recent X/Twitter posts worth responding to for marketing, customer discovery, founder-pain research, and community monitoring. Use when the user asks to check X search links, find posts from the last 24 hours, identify X posts to reply to, monitor founder conversations, or repeat the Launch Pulse/Idea Launch workflow for finding timely X posts with timestamps, URLs, and response-fit notes.
---

# X Post Search

For promotion work, first follow [the shared workflow](../../../templates/WORKFLOW.md). Use the explicitly selected product and its audience to choose queries; the founder/Idea Launch examples below are seeds, not defaults for every product. Keep product repositories read only and save research only in the selected promotion workspace or return it in chat. Research prepares opportunities and draft replies; it does not authorize posting or recurring monitoring.

## Overview

Find recent X posts that are worth replying to, not just posts that match keywords. Prioritize exact timestamps, original post URLs, and a short judgment on whether the post is a strong reply opportunity.

Use `scripts/search_x_posts.mjs` first for repeatable public search. It queries `tweetlook.com`, extracts the mirrored X status URLs, parses exact UTC timestamps, filters by age, dedupes, and emits JSON or Markdown.

## Fast Workflow

1. Define the intent buckets before searching:
   - Validation: founders asking how to validate, test, or decide whether to build.
   - Weak traction: MVP launched, no users, no signups, waitlist not converting.
   - First users: how to get first users, early customers, beta users.
   - Landing-page feedback: feedback, positioning, waitlist, signup conversion.
   - Paid-test friction: ads for validation, Meta ads, paid traffic, setup complexity.

2. Run the script from this skill directory (resolve it relative to this `SKILL.md`). The default queries are Idea Launch examples; use custom queries for other products:

```bash
node scripts/search_x_posts.mjs --hours 24 --format markdown
```

3. Add custom queries when the user gives specific search links or angles:

```bash
node scripts/search_x_posts.mjs \
  --hours 24 \
  --query "how to get first users SaaS" \
  --query "waitlist signups SaaS" \
  --query "validate startup idea" \
  --format markdown
```

4. Inspect results for reply quality:
   - **Strong**: the author has a concrete problem, asks for help, reports confusing/weak signal, or is deciding what to build.
   - **Medium**: adjacent advice/discussion where a helpful reply could add nuance.
   - **Weak/skip**: generic prompt lists, self-promo, engagement bait, broad quote-posts, or posts where Idea Launch would feel forced.

5. Return concise output:
   - State the check time and cutoff window.
   - List the best 3-8 posts with X URLs, relative age, topic, and why they are worth replying to.
   - Include a short "skip" section for matched posts that are too generic or promotional.
   - If access is blocked or sparse, say exactly what was verifiable and what was not.

## Query Bank

Start with these, then adjust to the product:

```text
validate startup idea
how do I validate startup idea
validate my SaaS idea
should I build SaaS startup app
feedback on my idea SaaS startup app
waitlist SaaS startup app signups traction
landing page validate startup idea SaaS
built an MVP no users no signups no traction
how to get first users SaaS startup app
how to get first users SaaS
pre launch waitlist demand validate SaaS startup app
run ads validate startup idea SaaS
building in public validate waitlist idea MVP
indie hacker validate waitlist MVP
pivot kill the idea move on startup SaaS MVP
would you use SaaS app I built thinking of building
landing page feedback SaaS
SaaS no traction
waitlist signups SaaS
```

For Idea Launch, prefer high-intent founder language over brand terms. The best searches usually mention validation, first users, weak traction, waitlists, landing pages, or build/pivot decisions.

## Verification Rules

- Treat a post as verified only if you have author handle, post text, exact timestamp, and canonical `https://x.com/<handle>/status/<id>` URL.
- Use exact UTC timestamps from the mirrored page to enforce the time window.
- De-dupe by canonical X URL.
- Do not present search-engine snippets as verified live posts.
- If X itself only returns a logged-out shell, say so and use the mirror/script results.
- Do not overstate quality: it is better to say "only one strong reply opportunity" than pad the list with weak matches.

## Response Framing

For marketing outreach, lead with helpful interpretation:

- Suggest what the post reveals about founder pain.
- Mention why a reply could be useful.
- Keep product mention secondary unless the user asks for reply drafts.
- For Idea Launch, frame around real traffic, cleaner demand signals, avoiding overbuilding, and removing ad-platform friction. Avoid making the reply sound like a direct pitch.
