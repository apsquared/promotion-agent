# Manual adapter

The default scheduler adapter for every project. It formalizes what the workflow already did: the agent prepares the exact content, account and time, and the user posts or schedules it themselves. It needs no tools, accounts or network access and works the same in Codex, Claude Code and OpenCode. Follow the [post scheduling procedure](WORKFLOW.md) for approval, lifecycle and bookkeeping.

## Operations

| Operation | Manual behavior |
|---|---|
| `capabilities(platform)` | Whatever the platform itself supports. On X: threads and links allowed; 280 characters per post (a link counts as 23) unless the user confirms the account has X Premium for longer posts; up to 4 images or 1 video per post. For other platforms use the limits the user or the platform's current help pages state; do not guess |
| `accounts()` | The handle the user names, or the handle in `scheduler.accounts`; confirm it with the user |
| `fit` | Usually nothing changes. Still check length per post, image count and that every link and asset is real |
| `schedule` | Produce the handoff below. Nothing external happens |
| `status` | `scheduled` once the user says they have posted or scheduled it; otherwise `approved` |
| `update` / `cancel` | The user edits or deletes the post in the platform; record what they report |
| `verify` | The user supplies the live URL; open it, check the text matches the approved text and the account is right, then record it. Without a URL you checked, the state is `uncertain` |

## Handoff

After approval, give the user, in one message:

1. The exact text of each post, numbered if it is a thread (`1/4`, `2/4`, …), each in its own copyable block, plus any reply that carries a link.
2. Assets with verified workspace paths, in posting order.
3. The account (handle) and platform.
4. The time in the project timezone and UTC.
5. If they want the platform to hold the time: the platform's own scheduling steps, checked against its current help pages when a browser is available. A composer may not schedule every format (threads in particular); then the user posts at the time.
6. What to send back: the live URL of the post (the first post of a thread).

Record the handoff with `Scheduled post: manual` and `Provider reference: manual handoff` once the user confirms it is posted or scheduled. If the user never confirms, the state stays `approved`; do not mark it scheduled.

## Verify

When the user gives the URL, open it with the browser tools available in this session. Check the account, the text (allowing only the platform's own link shortening), the thread order and media. Record any difference instead of calling it published. If no browser is available, say so and record the URL as user-reported, `uncertain`, until it can be opened.
