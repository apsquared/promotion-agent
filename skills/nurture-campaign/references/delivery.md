# Delivery mechanics

Examples use generic names; follow the repository's language, file layout, and naming.

## Content module (pure, no I/O)

- A closed enum or union of step ids, for example `activation | why-it-works | missed-feature | outcome-how-to | re-engage`.
- Each step: `{ id, dayOffset, build(context) }`. `build` returns `{ subject, preheader, blocks }` or `null` to skip.
- Blocks: `paragraph`, `bullets`, `cta` (label + URL), `link` (label + URL). Nothing else; rendering owns all markup.
- `context` holds the user's first name (optional), signup date, the per-user counts the branches need, feature flags, and the site base URL. It's built by the runner, so the module stays testable without a database.

## Timing

A step is due when both hold:

1. Its day offset after signup has passed.
2. The gap since the last email actually sent to this user has passed. Use the difference between consecutive day offsets, or a fixed minimum gap such as two days.

Rules:

- Send at most one email per user per run.
- Users who signed up long ago walk through at normal spacing, never a backlog of emails on consecutive days.
- Skipped steps (`build` returned `null`) are recorded as skipped so they aren't reconsidered, and don't count toward the gap.
- Walk steps in order; the first unsent, unskipped step decides what happens this run.
- Exclude admin, test, and internal accounts, and users without a verified or deliverable address when the app tracks that.

Keep the due-step decision a pure function of (signup date, sends history, now) so it can be unit-tested.

## At-most-once delivery

- A sends table or collection with a unique key on (user, step), plus status (`sending`, `sent`, `skipped`), provider message id, and timestamps.
- Before calling the provider, insert a `sending` claim. A unique-key violation means another run owns it; move on.
- On success, mark it `sent` with the provider's message id. On failure, delete the claim so the next run retries.
- Pass the provider's idempotency key, such as `nurture/<user-id>/<step>`, where the provider supports one.
- A stale `sending` claim (crash mid-send) should not be retried blindly; report it, or retry only after a timeout when the provider idempotency key makes a duplicate impossible.

## Rendering

- Plain-text and inline-styled HTML from the same blocks. HTML-escape every interpolated value.
- A hidden preheader at the top of the HTML.
- Tag links with `utm_source=<product>`, `utm_medium=email`, `utm_campaign=nurture`, `utm_content=<step>`. Never put an email address, name, or other personal data in a URL.
- Set Reply-To to a real inbox someone reads.

## Footer (CAN-SPAM)

Who sent it, why they're receiving it ("you signed up for X"), the postal address, and an unsubscribe link. If the postal address isn't configured, refuse to send and say so; a dry run may still render with a visible placeholder.

## Unsubscribe

- Token: an HMAC of the user id with a dedicated server secret, verified with a timing-safe comparison. No email address in the token or URL.
- The footer link opens a confirm page with a POST button, because link scanners prefetch GETs. The GET must change nothing.
- RFC 8058 headers: `List-Unsubscribe: <https://…/unsubscribe?token=…>` (optionally with a `mailto:`) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, pointing to a POST endpoint that unsubscribes without further interaction. Gmail and Yahoo require this of bulk senders.
- Store opt-outs in a separate email-preferences record, checked before every nurture send. Never email those users again.
- Respond the same way for unknown and known users, so the endpoint doesn't reveal who is registered.
- Hide the unsubscribe page from search engines (`noindex` meta and robots rules).
- Sign-in, password-reset, and other transactional emails must keep working after an unsubscribe.

## Runner

A CLI script that:

- dry-runs by default and sends only with `--send`;
- accepts `--only <email>` for test sends and `--limit N`;
- prints a summary: considered, sent (or would send), skipped, opted out, failed;
- exits non-zero if more than 20% of attempted users fail.

In dry-run mode, print step choices by user id or a masked address, not full personal data.

## Scheduling

Use the platform's native scheduler; for example, Vercel Cron in `vercel.json` calling a route that requires `Authorization: Bearer $CRON_SECRET` and sets a suitable `maxDuration`. The route runs the same function as the CLI, in send mode. If the repo already runs background work elsewhere (a queue, a worker, GitHub Actions, a hosted cron), use that instead. Run daily at a reasonable hour for the main audience.
