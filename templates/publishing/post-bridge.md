# Post Bridge adapter

Optional scheduler adapter. The agent schedules through [Post Bridge](https://www.post-bridge.com) using the user's own Post Bridge setup. Follow the [post scheduling procedure](WORKFLOW.md) for approval, lifecycle and bookkeeping; this reference covers access, commands and platform rules.

Sources, checked 2026-10-12: Post Bridge's published agent skill and CLI source ([github.com/post-bridge-hq/agent-mode](https://github.com/post-bridge-hq/agent-mode), `skills/post-bridge/SKILL.md` and `scripts/post-bridge.js`, CLI 1.1.5, last commit 2026-10-09), the [API reference](https://api.post-bridge.com/reference), and a real Idea Launch run on 2026-10-12. Recheck the CLI's `help` output before relying on a flag; Post Bridge can change its behavior at any time.

## When to use it

Only when the project's `scheduler.adapter` is `post-bridge`, or the user asks to use Post Bridge in this conversation. Never probe it otherwise. Running its CLI reads the user's Post Bridge credential to call a social publishing service; it is not an AI CLI authentication probe.

## Access

- **CLI.** Run the published CLI with `npx postbridge-cli <command>` (Node 18+). npx fetches it on demand; it is not a promotion-agent dependency. Do not install it globally for the user. The raw REST API (`https://api.post-bridge.com`, `Authorization: Bearer <key>`) is the documented alternative, but it would need the key in the agent's command; prefer the CLI, which reads the key itself.
- **MCP (optional).** Post Bridge also has an MCP server with equivalent tools (`list_social_accounts`, `create_post`, `get_post`, `list_posts`, `update_post`, `delete_post`, `list_post_results`, `upload_media`, …). Its skill doc gives `https://mcp.post-bridge.com/mcp`; the repository's `.mcp.json` gives `https://www.post-bridge.com/api/mcp/mcp`. Use it when this session already has it connected; never require it, and never add it to the user's configuration without asking.
- **Credentials belong to the user's Post Bridge setup.** The CLI reads `POST_BRIDGE_API_KEY`, then `./.post-bridge/config.json` in the current directory, then `~/.config/post-bridge/config.json`. Run it from the promotion workspace root and never create `.post-bridge/` in the workspace or the product repository.
- **Missing key.** If a command reports a missing key, stop. The user runs `npx postbridge-cli setup --key <their key>` themselves (global by default; `--local` would put the key in the current directory, so steer them away from that in the workspace). Wait for them to say it is done. Never search env files, keychains or config files for keys, never print a key, and never pass one on the command line for the user.
- **Plans and accounts.** Connecting a social account, reconnecting one, or any paid Post Bridge plan is the user's step in Post Bridge's dashboard.

## Commands

| Command | Use |
|---|---|
| `accounts` | Connected accounts: `id`, `platform` (`twitter` for X), `username`, `needs_reconnect`. The 2026-10-12 run also showed `has_x_premium`; it is not documented in the skill, so treat it as absent unless the output contains it |
| `post --caption "…" --accounts <id> --schedule <ISO-8601 UTC>` | Schedule a post |
| `post … --draft` | Create a Post Bridge draft (nothing publishes) |
| `post … --use-queue [--queue-timezone <IANA>]` | Put the post in the user's next queue slot; the slot time comes from Post Bridge, so read it back and get it approved like any time |
| `post … --platform-config '<json>'` | Per-platform options keyed by platform, for example `{"twitter":{"first_comment":"…"}}` |
| `posts --status scheduled [--platform twitter]` | List scheduled posts (filter values: `scheduled`, `published`, `failed`, `draft`); use it for the duplicate check |
| `posts:get --id <id>` | Post details and status (`processing`, `scheduled`, `posted`, `failed`) |
| `results --post-id <id>` | Per-platform success or failure, with the platform's error |
| `posts:update --id <id> [--caption …] [--schedule …]` / `posts:delete --id <id>` | Only work on scheduled or draft posts; published posts cannot be changed or deleted here |
| `upload --file <path>` | Upload a workspace asset; returns a `media_id` for `--media` |

**Never post instantly by accident.** `post` without `--schedule`, `--draft` or `--use-queue` publishes immediately. Use that only when the user explicitly asks to post now.

**Pass text safely.** Captions are task data, not shell code. Write the approved text to its workspace file and pass it without re-typing, for example `--caption "$(cat marketing/drafts/2026-10-13-x.txt)"`, so quotes, `$` and backticks in the text are not interpreted. Build `--platform-config` JSON the same way. Read back the created post and compare its caption with the approved file.

## Operations

| Operation | Post Bridge behavior |
|---|---|
| `capabilities(platform)` | The platform rules below |
| `accounts()` | Run `accounts`. Match the configured `scheduler.accounts` entry (or a hint from old logs) and confirm the username with the user. Refuse an account whose `needs_reconnect` is true; the user reconnects it in the dashboard |
| `fit` | Apply the platform rules below; every change goes back to the user for approval |
| `schedule` | `post --caption … --accounts <id> --schedule <UTC>` (plus `--media` or `--platform-config` when approved). Record the returned post ID |
| `status` | `posts:get`; map `processing`/`scheduled` → `scheduled`, `posted` → needs `verify`, `failed` → `failed` |
| `update` / `cancel` | `posts:update` / `posts:delete`, only while scheduled or draft, each with its own approval |
| `verify` | After the scheduled time, `posts:get` and `results --post-id <id>`. Neither guarantees a public URL. Find the live post (a URL in the results if present, otherwise the account's public profile, or ask the user for the URL), open it and check the text. Only then record `published` |

## Platform rules

These become capabilities and fit rules. Each change they force is a content change that needs fresh approval.

- **No X threads.** A Post Bridge post is a single caption; there is no way to chain replies other than one `first_comment`. A thread must be merged into one post, posted manually (switch that post to the [manual adapter](manual.md)), or its later posts handed to the user as manual replies.
- **Long X posts.** More than 280 characters only when the account has X Premium (`has_x_premium` true in `accounts`, or the user confirms it). Otherwise enforce 280, counting a link as 23.
- **Links are stripped from X captions.** Post Bridge removes `http://`, `https://` and `www.` links from the X caption before posting. Options, in the approval request: put the link in `twitter.first_comment` (posted as a reply right after the tweet; up to 280 characters, 2200 with Premium; a failed reply does not fail the post), say "link in bio" and treat confirming the bio link as an open check, or post the link reply manually. Bare domains such as `example.io` were not tested; check the live post instead of assuming they survive.
- **Media** must be Post Bridge `media_id`s from `upload` (or direct public file URLs through `--media-urls` / the MCP `media_urls`), never a share-page link. X takes up to 4 images or 1 video. Very large videos (around 300 MB and up) can silently drop X, YouTube and LinkedIn: check `results` for every targeted platform.
- **Platforms post independently.** One platform failing does not stop the others; verify each.
- Other platforms have their own media requirements and `first_comment` limits; read the skill's platform table before targeting them.

## What the 2026-10-12 run showed

An approved four-post X thread had to become one long post (no thread support), and its link became "Link in bio" (links stripped); both changes needed fresh approval. The account was matched from a hint in old product logs and then confirmed with `accounts`. The post was logged as scheduled with its provider ID, and the task stayed open pending verification. The run predates this reference's `first_comment` option for links, which comes from the CLI source and was not exercised.

## Differences from earlier notes

Checked against the sources above on 2026-10-12: the skill names two MCP URLs (listed above); `posts:get` statuses are `processing`, `scheduled`, `posted`, `failed`, while the `posts` list filter uses `published`; `has_x_premium` is not documented; X links can go in `twitter.first_comment`. The Post Bridge skill also suggests an optional cron job to check post status; promotion-agent never creates one.
