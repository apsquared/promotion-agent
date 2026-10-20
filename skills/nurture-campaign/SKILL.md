---
name: nurture-campaign
description: Design, build, and verify a lifecycle email nurture sequence for a product's registered users, bringing them back and showing its value. Use when adding onboarding, activation, or re-engagement emails to an existing app, including timing, at-most-once delivery, CAN-SPAM footer, one-click unsubscribe, scheduling, and privacy-policy updates.
license: MIT
---

# Nurture Campaign

Build a short email sequence (about five emails over two to three weeks) that brings registered users back to the product and helps them reach its value. Adapt to the repository's framework, database, email provider, and scheduler. Optional inputs: product notes, tone, number of emails, sender name.

## Scope and boundaries

Carry the campaign through content, delivery, unsubscribe, scheduling, docs, and tests; do not stop at a plan unless asked. Invocation does not authorize emailing real people, pushing, deploying, or adding production secrets. Recipients come only from the product's registered-users table, never from imported, scraped, or third-party contact data. Preserve unrelated edits and obey repository instructions and session permissions.

## 1. Investigate before writing anything

- Read the project docs (README, CLAUDE.md/AGENTS.md, product docs) and the marketing pages: what the product does, its core value claim, and what it must never claim.
- Find how users are stored (schema, created-at field, admin or test flags), how the app already sends email (provider, from address, env vars), and where scheduled or background work runs.
- List the actions that show a user getting value (first project, first export, integration connected, items created) and how to count each per user from the database.
- Read the Privacy Policy and any repo rules about email. If they say "no marketing email" or list the only emails the app sends, flag the conflict to the user. Don't quietly work around it.

Record a compact evidence map: relevant files, value actions with their queries, existing email plumbing, and open decisions.

## 2. Ask only the user's decisions

One round, each with a recommended option:

- **Existing users:** email everyone (with unsubscribe), new signups only, or explicit opt-in only.
- **Legal sender details:** the postal address required in commercial email (CAN-SPAM), as an env var or a value the user gives.
- Anything else the code can't answer, such as a policy conflict found in step 1.

Pick sensible defaults for everything else (sender name, Reply-To inbox, send hour, tone) and state them.

## 3. Design the sequence

Read [sequence design](references/sequence.md) for the default five-step arc (activation, why it works, the missed feature, how to get the outcome, re-engagement), branching, and copy rules. Every link must point to a page that exists, every claim must be backed by the product, and personalization comes only from the user's own records.

## 4. Build it

Read [delivery mechanics](references/delivery.md) before writing code. It covers:

- a pure content module with a closed enum of step ids and `build(context)` returning blocks or `null`;
- timing that walks long-ago signups through at normal spacing, one email per user per run;
- at-most-once delivery through a unique (user, step) sends record and provider idempotency keys;
- plain-text and HTML rendering from the same blocks, UTM tagging without personal data, and Reply-To;
- the CAN-SPAM footer, refusing to send without a postal address;
- HMAC-signed unsubscribe with a POST confirm page and RFC 8058 one-click headers;
- a dry-run-by-default CLI runner and a secret-protected scheduled route that call the same function.

Reuse the repository's existing email client, database access, and background-work conventions. Add no dependency without a concrete need.

## 5. Update everything the change touches

- The Privacy Policy (what's sent, how to opt out, the email provider as a processor) and its "last updated" date.
- Repo rules or agent docs that list which emails the app sends.
- `.env.example` (postal address, sign-off, cron secret, unsubscribe signing secret) with names only, never values.
- A short runbook doc: sequence table, timing, commands, where data is stored, unsubscribe, and measurement.
- Database indexes, including the unique (user, step) key.

## 6. Verify without emailing real people

Read [verification](references/verification.md). Run unit tests, the full suite and typecheck, a dry run against the real database, unsubscribe checks with a non-existent user, the cron route's 401, and render every email into one HTML preview file to show the user.

## 7. Ship

Commit with a clear message when the user asks for commits. Before pushing, deploying, or adding production secrets, tell the user how many real users the first run will email (from the dry run) and wait for their go-ahead. Generate secrets without printing them.

## Completion report

Summarize the sequence (step, day, subject, branch), changed files, decisions and defaults, and remaining blockers. Report separately: implemented; unit-tested; dry-run against real data (with recipient count); unsubscribe and cron auth checked; preview shown; test send to the user's own address; deployed; first real run. Mark anything not done as not done.
