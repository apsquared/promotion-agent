# Product Hunt MCP server

Checked 2026-11-09 against the [install page](https://www.producthunt.com/mcp/install) and the server's own `initialize` and `tools/list` responses (server `producthunt-mcp` 1.0.1). The server announces `listChanged`, so tools can change: trust the live tool list and descriptions over this file, and update the date here when you re-check.

## Connect

- Server URL: `https://mcp.producthunt.com/mcp`, Streamable HTTP, server name `producthunt`.
- Auth: OAuth with PKCE. There is no API key. The user signs in to Product Hunt in their browser and approves access. Scopes include `mcp:account`, `launches:read`, `launches:write`, `ads:read` and `ads:write`.
- Research tools (search, profiles, leaderboard) answered without sign-in on 2026-11-09. Launch tools, including `get_launch_context`, need the user's account and otherwise return "Connect your Product Hunt account to use this tool."

Give the user the line for their client and let them run it and sign in:

| Client | Connect |
| --- | --- |
| Claude Code | `claude mcp add --transport http --scope user producthunt https://mcp.producthunt.com/mcp`, then `/mcp` → producthunt → Authenticate |
| Codex | `codex mcp add producthunt --url https://mcp.producthunt.com/mcp`, then `codex mcp login producthunt` |
| Gemini CLI | `gemini mcp add --transport http --scope user producthunt https://mcp.producthunt.com/mcp`, then `/mcp auth producthunt` |
| VS Code | `code --add-mcp '{"name":"producthunt","type":"http","url":"https://mcp.producthunt.com/mcp"}'`, then start it from the MCP view and sign in |
| Cursor | Add `"producthunt": {"url": "https://mcp.producthunt.com/mcp"}` under `mcpServers` in `~/.cursor/mcp.json`, then sign in from Customize |
| Claude (web/desktop) | Customize → Connectors → Add → Custom → Web, name it Product Hunt, paste the URL, Connect |
| ChatGPT | Plugins → + → Add custom MCP server, paste the URL, choose OAuth |
| Amp | `amp mcp add producthunt https://mcp.producthunt.com/mcp` |
| opencode | `opencode mcp add producthunt --global --url https://mcp.producthunt.com/mcp`, then `opencode mcp auth producthunt` |

Any other client that supports remote MCP with OAuth (CIMD or DCR) can use the URL. To check the connection, call `get_my_account` (or ask "Which Product Hunt account am I connected as?"). To disconnect, the user removes the server in their client's settings.

## Tools

Read-only unless marked.

| Tool | Use it for |
| --- | --- |
| `get_my_account` | Which account is connected. |
| `get_launch_context` | Composer limits, account eligibility, availability of a launch day (midnight Pacific), the existing product a link belongs to, your matching draft, a recent launch of the link, and ID lookups for topics, categories, makers, funding backers and shoutout products. Availability is a snapshot, not a reservation. |
| `list_my_launches` | Launches you own or manage, by status: `draft` (not submitted), `unscheduled`, `scheduled`, `live`. Shows `permitted_actions` per launch. |
| `get_launch` | A launch's current `values`, `assessment` (what needs a change or decision, launch programs such as contests and Hypership open that day, investor questions), `editable_fields`, `revision`, makers, `prepared_assets`, `url` and `editable_section_urls` (media, company_info, investor_questions). |
| `start_launch` (write) | Create a private draft for a product link, or resume your unsubmitted draft for the same link. Never submits, schedules or enrolls. |
| `prepare_launch_asset` (write) | Stage a thumbnail or gallery image. Staging does not attach it. |
| `update_launch` (write, can be public) | Change fields. Private draft changes apply directly; public changes, moving a submitted launch's day and notifying added makers return `needs_confirmation`. |
| `submit_launch` (write, public) | Submit a draft so it is scheduled for its day. Always two calls: preview, then submit with the token. |
| `submit_feedback` (write) | Report friction with the tools to Product Hunt. |
| `search_launches`, `get_leaderboard`, `get_categories`, `get_products`, `find_alternatives`, `get_product_profile`, `semantic_product_search` | Research: recent launches in a category, past days' winners, competitors, alternatives, a product's profile, reviews and ratings. |
| `find_investable_startups` | Investor sourcing. Not needed for launching. |

## Flow

1. **Resolve.** `get_launch_context` with `url` (and `launch_date` to check a day). If it finds an existing product, ask the user whether this launch belongs to it. If yes, use `product_choice: "existing"` with its `product_id`; a link that belongs to an existing product is refused as new. With no product found, it is a new product, so skip the product question. Use the same tool to look up topic, category, maker, backer and shoutout IDs by name.
2. **Start.** `start_launch` with `url`, the product choice, the approved `values` (same fields as `update_launch` changes, without images) and an `idempotency_key`. If the outcome is unknown, retry with the identical request and key; the retry returns the original draft. `created: false` means an existing draft was resumed unchanged.
3. **Stage images.** For each image, call `prepare_launch_asset` with `kind` (thumbnail or gallery) and one source:
   - `source_url` when the image is already at a public URL;
   - otherwise, for a local file, call with no source, then upload the file as multipart field `file` to the returned `upload.url` with `upload.headers`, before `upload.expires_at`: `curl -X POST -H "Authorization: Bearer <upload ticket>" -F file=@image.png <upload.url>`. The ticket is for this one asset; never send the MCP connection's own token there;
   - base64 `content` only when the upload URL can't be reached (3 MB limit on the server, often less in the client).
   Formats: PNG, JPEG, WebP or GIF, up to 10 MB, 10,000 px per side and 40 megapixels. Retry with the same key for the same asset or a fresh ticket.
4. **Attach and fill.** `update_launch` with `launch_id`, `expected_revision` (the `revision` from the last read), an `idempotency_key` and `changes`: `thumbnailAssetId`, the complete ordered `galleryAssetIds`, and any other fields. Change only `editable_fields`. On `revision_conflict` nothing changed: re-read, keep the user's requested changes, ask about competing edits and send only those changes.
5. **Review.** `get_launch`. Present the `assessment`: blockers, then optional suggestions, then programs. Suggest the next step and get permission before changing anything.
6. **Preview the submission.** `submit_launch` without `confirmation_token`. The result is `needs_confirmation` with `preview.submit` (the full submission: product, day, public content and links, final tags, makers, images, first comment, shoutouts, funding, company, investor answers, programs, product page edits), `side_effects`, `warnings` and a token valid for 15 minutes. `validation_failed` means a blocker: fix it with `update_launch` first.
7. **Submit.** Only after the user explicitly approves that preview, call again with the token and the same idempotency key. `confirmation_invalid` means the launch, the day's availability, permissions or assets changed: preview again. If the outcome is unknown, retry the identical request; a retry returns the launch even after the token expires. A submitted launch's `launch_id` becomes its numeric ID.
8. **Verify.** `get_launch` to confirm status, day and URL.

## Confirmations

`update_launch` and `submit_launch` return `needs_confirmation` for anything public or with side effects. Show the user the preview, the reasons and every side effect, wait for an explicit yes, then resend with the `confirmation_token` and without `preview`. Use `preview: true` only when the user wants to see an edit before deciding. If the user asked for draft edits and also wants to see the submission, save the edits first, then preview with `submit_launch`.

Even a not-yet-live launch can change a public product page (team size, funding, Crunchbase or YC links on an existing product), so never promise an edit stays private. Once a launch is live, every change is public.

## Field notes

- `commentBody` (the first comment) is HTML: `<p>`, `<ul>`/`<ol>` with `<li>`, `<strong>`, `<em>`, `<a href>`, `<br>`. Plain text works as written. Markdown is **not** converted, so `**bold**` and `- ` lines show literally.
- `launchDate` is `YYYY-MM-DD` in America/Los_Angeles, checked against availability and never shifted. A draft only stores it; moving a submitted launch moves it (and any ad orders) to 00:00 Pacific that day, and needs confirmation.
- `makerIds` come from `get_launch_context`. Include the user's own ID for them to be a maker; website email invitations are kept.
- `topics` and `categories` are IDs from `get_launch_context`.
- `pricingType`: `free`, `free_options` or `payment_required`. `productState`: `default`, `pre_launch` or `no_longer_online`.
- `additionalLinks`: up to 20. `videoUrl` and `interactiveDemoUrl` must be embeddable links. `mcpServerUrls`: the product's MCP endpoints, if any.
- `promoText` (up to 25 characters), `promoCode`, `promoExpireAt`.
- `shoutouts`: `{productId, note (20 to 2,000 characters), rating 1–5}`, up to 20, public and in the user's name. Only the products, notes and ratings the user chose. `[]` records a decline.
- `programParticipation`: keyed by program ID from the assessment. Explain the effects; never infer enrollment.
- `investorConnectionResponses`: private, maker-only answers to Product Hunt's investor partners, keyed by prompt ID. Only text the user wrote or approved.
- The schema's length limits are looser than the website's (for example, tagline 500); write to the [website limits](launch-page.md#limits) unless `get_launch_context` reports others.
