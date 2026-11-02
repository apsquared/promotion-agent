---
name: chat-replay
description: Make a demo video of a product being used inside an AI assistant (its MCP server, plugin, app or skill in Claude or Codex) from a real conversation, without screen recording. The transcript is cleaned to its gist and rendered with HyperFrames in a chat-app skin, with typing, tool calls, streamed replies, captions and zooms. Use for "a demo video of my MCP server", "show my plugin working in Claude or Codex", "turn this chat into a video", and marketplace, docs or launch demo clips.
license: MIT
---

# Chat replay

Make one demo video of a product used through an AI assistant as a reviewable draft: an approved script, a rendered MP4 and a contact sheet. Rendering does not publish, schedule or deploy anything.

Live agent sessions are too slow and unpredictable to record well. A chat replay rebuilds a real session instead: the transcript is cleaned to its gist, then [chat-replay.mjs](scripts/chat-replay.mjs) renders it as a HyperFrames composition in a chat-app skin. Typing, thinking, tool calls, streaming replies, scrolling, captions and one zoom per point are all on a fixed timeline, so waits are short, the result repeats exactly and edits are cheap.

Use it when the product's value shows up inside an assistant conversation. For a tour or promo of the product's own site or app, use a site video instead. Inside a promotion-agent workspace, use its `video` activity; it includes this mode with task tracking and evidence.

## Hard boundaries

- **Where the project lives.** Keep the video project in its own directory, outside the product's repository by default (recommended: `~/product-videos/<project>/`). Use another location only when the user chooses it. Treat the product repository as read only. Never commit, push or deploy.
- **No publishing.** Nothing is published or scheduled. A rendered video is a draft until the user approves it; posting it is a separate request.
- **Accounts and spending.** A chat replay needs no HeyGen sign-in or paid credits. Never create accounts, sign in, paste API keys or trigger paid generation for the user.
- **Dependencies.** Add no dependency to the user's projects. HyperFrames runs through `npx`, and the generator is a single Node.js script with no dependencies. Installing FFmpeg or HyperFrames' agent skills changes the user's machine, so ask first.
- **Agents.** Do not launch another AI CLI.

## Honesty rules

A replay looks like real use, so it must be a faithful edit of a real session, not a staged one.

- **Every beat comes from the transcript.** User, thinking, tool, assistant and widget beats cite the transcript turns they come from in `from`; the generator refuses beats without it. Never invent a tool call, a tool result, a capability or a number.
- **Allowed edits:** fix typos in user messages; shorten them to their intent; drop failed calls, retries, dead ends and chit-chat; merge a retry into the call that succeeded; trim and tighten assistant replies; shorten tool inputs and statuses into a readable summary; compress waiting time.
- **Not allowed:** changing what a tool returned, changing the order of cause and effect, adding steps that did not happen, putting words in a reply that change its meaning, or showing a feature the product does not have today.
- **Real time stays visible.** Give a thinking beat `realSeconds` from the transcript so it reads "Thought for 9s" (`claude`) or "Worked for 9s" (`codex`, where it is the turn's real working time) even though the video spends about a second on it.
- **The disclosure stays on.** The skin's top bar carries "Recreated from a real session" by default. Turning it off (`"disclosure": false`) requires saying so in the post copy instead.
- **No vendor assets.** The skin is a recognizable chat layout and palette, not a copy of a vendor's logo, fonts or icons. Do not add them.
- **Privacy.** Use a transcript from a demo account with fictional or public data. Remove names, emails, account IDs, file paths and customer data before cleaning; if they cannot be removed without changing the gist, use a different session. Names in `sidebar` are on screen too: use fictional or public project and thread names, or leave them out.

## Check availability

Run `node --version` and `npx hyperframes doctor --json` (it exits 0; read its `ok` field and whether FFmpeg was found). The first `npx` run downloads HyperFrames, and rendering fetches GSAP and fonts, so the machine needs internet access. Without FFmpeg the build, check and snapshots still work but rendering does not: say so and ask before installing it (for example `brew install ffmpeg` on macOS).

## Steps

1. **Brief.** Ask only what is missing, one question at a time, each with a recommended default: which assistant skin (`claude`, light with an icon rail and tool cards, or `codex`, the light Codex desktop app look with a window, project and thread list, "Worked for …" and "Called …" tool rows), destination (16:9 only so far; YouTube, docs, a marketplace listing or a landing page), captions (default yes: one numbered caption per step, the first one a hook that is on screen at 0 s), and whether a tool returns UI worth showing as a widget. Then run `npx hyperframes init "<project-dir>" --non-interactive --skip-skills --example=blank` before writing anything into the directory: init refuses a non-empty one, and `--skip-skills` stops it from installing HyperFrames' skills globally, which is the user's decision.
2. **Source.** Save the conversation as `transcript.md` in the project with numbered turns (`T1`, `T2`, …), each marked user, assistant, thinking (with its real duration), tool (server, name, input, result) or widget, like the [example transcript](examples/transcript.md). Copy it from the assistant's conversation or session log; do not reconstruct turns from memory. Look at all of it and remove private data first.
3. **Clean up.** Write `replay.json` ([format](references/replay-format.md)) and `SCRIPT.md`: the beats in reading order, each with its `from` turns, plus a **Changes** list saying what was cut, merged, shortened or compressed and why. Show `SCRIPT.md` to the user and get approval before building. Approval of an earlier version does not cover a changed script.
4. **Widgets.** A widget beat shows an image of the tool's real UI (an MCP App or Apps SDK view, or a rendered result). Screenshot it at 2× from a demo account with fictional data, save it under `assets/`, and look at it before use.
5. **Build.** Run `node <skill-dir>/scripts/chat-replay.mjs <project-dir>/replay.json <project-dir> --force`, where `<skill-dir>` is this skill's folder; `--force` replaces the blank starter once. Later builds need no flag: the generated `index.html` carries a marker and is rebuilt from `replay.json` every time, so change `replay.json` and rebuild rather than editing `index.html`. `--check` validates and prints the timing without writing.
6. **Check and look.** In the project, run `npx hyperframes check` until it reports 0 errors. Expected warnings for a 16:9 replay: `text_below_floor` (chat text is sized for desktop viewing), `film_silent` when there is no music, `line_unread` on the composer draft (and on a reply's first lines when a widget scrolls them away), and `nested_structure_needs_subcomposition`. Run `npx hyperframes snapshot --at <times>` at the times the generator prints (each beat's end, each zoom's midpoint, 0 s for the thumbnail) and look at every frame: nothing private, the newest message in view, the zoom ring on the right element, captions readable.
7. **Review and render.** Run `npx hyperframes preview --background` and show the user the preview URL. Ask one question: render now, or what should change? After approval, run `npx hyperframes render --quality high --output renders/<name>.mp4` and stop the preview. Then look at frames taken from the MP4 itself (`ffmpeg -ss <t> -i <file> -frames:v 1 <out>.png`) at the same times: a render can differ from snapshots. Deliver the MP4 path with its duration (from `ffprobe`) and a contact sheet of those frames. The render is still a draft.
8. **Record.** In the project, write a `README.md` with a row per render: path, duration, skin, the transcript it came from and its date, whether the disclosure is on, and a one-line description for alt text. `SCRIPT.md` keeps the list of changes.

Report the brief, script approval, the render path and duration, what was checked and what was not, and natural next steps (posting copy for the destination, a shorter cut). Do not post or schedule anything.

## Try the example

The [examples](examples/) folder holds a fictional session, its cleaned [replay.json](examples/replay.json) for the `claude` skin and [replay-codex.json](examples/replay-codex.json) for `codex`. To see the result before using your own transcript:

```sh
npx hyperframes init demo --non-interactive --skip-skills --example=blank
cp -R <skill-dir>/examples/. demo/
node <skill-dir>/scripts/chat-replay.mjs demo/replay.json demo --force
cd demo && npx hyperframes preview
```

Use `demo/replay-codex.json` in the third command for the Codex skin.
