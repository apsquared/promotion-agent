# Verification

Verify without emailing real people.

## Unit tests

- **Timing:** nothing due before day 1; steps fire in order; a long-ago signup gets one email per run at normal spacing, not a backlog; skipped steps don't count toward the gap; at most one email per user per run.
- **Content branches:** activation already done vs not; missing feature skipped; zero-count fallback copy in the re-engagement step.
- **Overclaiming:** no email contains a phrase the product disclaims (banned list from the product's own pages).
- **Links:** every URL in every step resolves to a known route, has the UTM parameters, and contains no email address.
- **Unsubscribe token:** a valid token verifies; a forged, truncated, or other-user token fails; comparison is timing-safe.
- **Rendering:** the footer contains sender, reason, postal address, and unsubscribe link; HTML-escaping holds for a name like `<script>`; sending is refused without a postal address.
- **Delivery:** a duplicate (user, step) claim is rejected; a provider failure deletes the claim.

## Whole-project checks

- Run the full test suite and typecheck.
- Dry run against the real database: who would get which email, as counts per step plus masked or id-only samples. Don't print personal data beyond what's needed.
- Load the unsubscribe page and POST endpoints in a browser or with curl using a non-existent user, so nothing real changes. Confirm the GET changes nothing and the page is `noindex`.
- Check that the cron route returns 401 without the secret and with a wrong one. Never call it authorized from a machine pointed at production data and a live email key.
- Render every email (each branch) into a single HTML preview file and show it to the user.
- Optionally, with the user's go-ahead, `--send --only <their own address>` to check real inbox rendering and the one-click unsubscribe headers.

## Before the first real run

Report the number of real users the first run will email, and per step. Wait for the user's go-ahead before pushing, deploying, or adding production secrets.
