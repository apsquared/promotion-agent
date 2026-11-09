---
name: product-hunt-launch
description: Plan, prepare, stage and run a Product Hunt launch or relaunch for a product, following Product Hunt's own launch guide and using the official Product Hunt MCP server (mcp.producthunt.com) when it is connected. Use for "launch on Product Hunt", "get us ready for PH", "write our tagline / first comment / gallery", "pick a launch day", "draft / schedule / submit our launch", "is our launch ready?", "launch day plan", "how did our launch do", or a relaunch after a major update. Drafts copy and outreach that ask for feedback, never upvotes; stages a private draft through the MCP; submits, reschedules or makes public edits only after the user approves the exact preview.
license: MIT
---

# Product Hunt Launch

Take a product from "we should launch on Product Hunt" to a finished launch: goals, launch day, page copy, media, a staged draft, an outreach plan, launch-day coverage and the follow-up. Work from the product's own sources and Product Hunt's current rules. This skill is not affiliated with Product Hunt.

## Modes and hard boundaries

Follow the requested mode: **plan**, **prepare** (copy, media, outreach drafts), **stage** (private draft through the MCP), **submit**, **launch day**, or **review** (results and next launch). Invocation alone authorizes reading, research and drafts in the conversation, nothing on Product Hunt.

- **Claims come only from the product's own sources**: its site, docs, repo, changelog and what the user tells you. Never invent features, numbers, customers, awards, pricing or funding. Mark anything unconfirmed as a question for the user.
- **Never ask for upvotes**, in any copy, DM, email, post, README banner or in-product message, and never suggest anything that requires or rewards an upvote. Ask people to try the product, comment and share feedback. This is Product Hunt's rule, and breaking it gets launches removed.
- **Refuse manipulation**: paid upvotes or comments, upvote-exchange groups, extra or fake accounts, company/brand accounts posting, mass DMs, scraped lists, copy-pasted messages to strangers, and changing the product URL to dodge the relaunch check. Say why and offer the legitimate alternative.
- **The user signs in.** Never create accounts, enter credentials or approve the MCP's OAuth screen. Connecting the MCP is the user's step; give them the line for their client ([MCP reference](references/mcp.md#connect)).
- **Product Hunt actions are external actions.** Starting a private draft or staging images needs the user's go-ahead for this launch. Anything the server answers with `needs_confirmation` (submitting, a public edit, moving a submitted launch's day, notifying added makers) needs a separate, explicit approval of that exact preview. Show the preview, its `side_effects` and warnings in full. A confirmation token proves a preview was returned, not that the user approved it: never send one on your own judgment, and never reuse an approval for a different preview.
- **Public things the user must choose themselves**: shoutouts (public reviews in their name), investor-connection answers, funding details, launch programs and contests, makers to notify, promo codes. Ask; never infer them. Saving `shoutouts: []` records a decline.
- No posting, emailing, DMing or scheduling outside Product Hunt from this skill. Draft those messages for the user to send, or hand them to a publishing tool the user already approved.

## The model

Read [the launch playbook](references/playbook.md) for the full guidance; the short version:

- A launch goes live at 12:01 AM Pacific on its day and runs until midnight Pacific. It can be scheduled from tomorrow up to 30 days ahead, and its day can be moved later.
- The team hand-picks which launches are **featured**; only featured launches compete for the daily ranking and Product of the Day. A launch that isn't featured still goes live at its link. Features go to products that are new or majorly updated, try-able now, plainly explained, working for a first-time user and clearly different from the obvious alternative.
- Ranking weighs upvotes, comments, time since launch and other signals. Upvotes from established, active members count far more than new accounts, so traffic from strangers who were told to "upvote" is worth little and risky.
- No hunter is needed: makers should post their own product. Direct links to the product are fine.
- The outcome that matters is the user's goal (signups, feedback, sales, conversations), not the rank. The audience a product brings from outside Product Hunt decides most launches.

## 1. Check the connection and the history

Ask the Product Hunt MCP who the user is (`get_my_account`). If it is not connected, say so, give the connect line for their client, and continue with research through the website and drafts in the conversation; the user can paste the finished packet into the website composer.

Before anything else, check for earlier work: `list_my_launches` for an existing draft (resume it, never start a duplicate) and `get_launch_context` with the product URL for an existing product page or a recent launch. A launch of the same link in the last two months needs a relaunch request through Product Hunt; a relaunch needs a major update (see [playbook](references/playbook.md#relaunch)). If someone else already hunted the product, explain the two options from the playbook.

## 2. Goals, fit and day

Agree on one or two measurable goals ("200 signups from PH", "30 pieces of feedback"). Check fit against the featuring criteria and say plainly what could keep the launch from being featured: a closed beta, a blog post or list, a minor update, a broken first-run flow. Test the main flow as a new user in a clean browser if you have one, or ask the user to.

Pick the day the team is most ready for and can be present for the first hours and their audience's peak, not a "magic" weekday. Weekdays bring more traffic and more competition; weekends are quieter. Check holidays in the core market and the team's travel. Read the day's availability from `get_launch_context` (a snapshot, not a reservation). Calibrate expectations with comparable launches: `search_launches` and `get_leaderboard` for the category, `find_alternatives` for competitors, and the product's own profile if it has one.

## 3. Prepare the page

Write the page from [the launch page reference](references/launch-page.md): name, tagline, description, first comment, launch tags, links, pricing, media, makers and an optional offer. Draft to the website composer's limits, and use the limits `get_launch_context` reports when they differ. Before staging, put the copy and outreach drafts in a JSON file shaped like the fictional [example](examples/launch.json) (in the scratch area, not the product repo, unless the user wants it kept) and run `node scripts/check-launch-copy.mjs launch.json` from this skill's folder. [The script](scripts/check-launch-copy.mjs) checks length limits, upvote asks, superlatives, link shorteners and Markdown in the first comment. Fix every error it reports and weigh the warnings.

Media: a logo/thumbnail, three or more gallery images showing the product in use, and a short demo video or click-through demo when possible. If the user wants a video and the session has a video skill (`product-video`, or `chat-replay` for an AI-assistant demo), hand that step off. If the product has an MCP server, include its URL in `mcpServerUrls`.

## 4. Stage the draft

With the user's go-ahead, follow the [MCP flow](references/mcp.md#flow): `get_launch_context` (product choice, topic/category/maker IDs), `start_launch` with the approved values, `prepare_launch_asset` for each image, then `update_launch` to attach the thumbnail and ordered gallery. Pass `expected_revision`, and use one idempotency key per intended action so a retry never doubles it. Then read `get_launch` and walk the user through its `assessment`: blockers first, then optional improvements, then launch programs open that day (explain them; never enroll on your own). Where a field is easier to edit on the website (video, demo, company info), link the matching `editable_section_urls` entry.

## 5. Submit

Submission is reviewed, and incomplete launches can be removed, so submit only a finished page. Call `submit_launch` without a token to get the preview. Show the user the complete preview: the day, every public field, makers, images, first comment, shoutouts, programs, and each side effect (the first comment is posted, makers are added, followers are notified). Submit with the token only after their explicit yes to that preview. If the token expired or the launch changed (`confirmation_invalid`), preview again. Confirm the result with `get_launch` and report the status and URL.

## 6. Outreach and launch day

Build the plan from [promotion](references/promotion.md): who already knows the product (users, newsletter, communities where the team is active, personal networks), one message per channel, and the order to send them on the day. Draft every message, each one asking people to try it and say what they think. Give the user a launch-day run sheet: shifts so someone answers comments all day (overnight for teams outside the US), who replies to what, when each message goes out, and what to check (the launch dashboard, `get_launch`). Edits once a launch is live are public; each one goes through the preview and approval step.

## 7. After the launch

Keep replying for several days. Compare the results with the goals, list the feedback worth shipping, draft thank-you and follow-up messages, and plan the website badge, reviews and Forums updates. Recommend a relaunch only for a major update, and no sooner than two months without a relaunch request.

## Evidence and report

Report each item's level: **drafted** (in the conversation or a local file), **staged** (private draft on Product Hunt, with its launch ID), **previewed**, **submitted/scheduled** (with day and URL), **live**, **verified** (read back with `get_launch`). Never call a launch scheduled, live or featured until a read confirms it; featuring is the team's decision and cannot be confirmed in advance.

Finish with the launch packet (goals, day, page copy, media list, assessment status), the outreach drafts, the launch-day run sheet, open blockers with the user's exact next step, and dated follow-ups. Write follow-ups as self-contained prompts the user can paste into an agent, and mark steps only a person can do (signing in, approving a preview, sending a DM from their account) as `Human required:`. If an MCP tool failed or confused you, you may report it with `submit_feedback`, without personal details or product secrets, and tell the user you did.
