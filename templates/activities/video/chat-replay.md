# Chat replay

Part of the product video procedure. A chat replay shows a product being used through an AI assistant, for example its MCP server or plugin in Claude or ChatGPT. It is rebuilt from a real conversation instead of screen-recorded: the transcript is cleaned to its gist, then [chat-replay.mjs](chat-replay.mjs) renders it as a HyperFrames composition in a chat-app skin. Typing, thinking, tool calls, streaming replies, scrolling, captions and one zoom per point are all on a fixed timeline, so waits are short, the result repeats exactly and edits are cheap.

Use it when the product's value shows up inside an assistant conversation. For the product's own site or app, use the normal site tour or promo.

## Honesty rules

A replay looks like real use, so it must be a faithful edit of a real session, not a staged one.

- **Every beat comes from the transcript.** User, thinking, tool, assistant and widget beats cite the transcript turns they come from in `from`; the generator refuses beats without it. Never invent a tool call, a tool result, a capability or a number.
- **Allowed edits:** fix typos in user messages; shorten them to their intent; drop failed calls, retries, dead ends and chit-chat; merge a retry into the call that succeeded; trim and tighten assistant replies; shorten tool inputs and statuses into a readable summary; compress waiting time.
- **Not allowed:** changing what a tool returned, changing the order of cause and effect, adding steps that did not happen, putting words in a reply that change its meaning, or showing a feature the product does not have today.
- **Real time stays visible.** Give a thinking beat `realSeconds` from the transcript so it reads "Thought for 9s" (`claude`) or "Worked for 9s" (`codex`, where it is the turn's real working time) even though the video spends about a second on it.
- **The disclosure stays on.** The skin's top bar carries "Recreated from a real session" by default. Turning it off (`"disclosure": false`) requires saying so in the post copy instead.
- **No vendor assets.** The skin is a recognizable chat layout and palette, not a copy of a vendor's logo, fonts or icons. Do not add them.
- **Privacy.** Use a transcript from a demo account with fictional or public data. Remove names, emails, account IDs, file paths and customer data before cleaning; if they cannot be removed without changing the gist, use a different session. Names in `sidebar` are on screen too: use fictional or public project and thread names, or leave them out.

## Steps

1. **Brief.** Ask, one question at a time with a default: which assistant skin (`claude`, light with an icon rail and tool cards, or `codex`, the light Codex desktop app look with a window, project and thread list, "Worked for …" and "Called …" tool rows), destination (16:9 only so far; YouTube, docs or a landing page), captions (default yes: one numbered caption per step, the first one a hook that is on screen at 0 s), and whether a tool returns UI worth showing as a widget.
2. **Source.** Save the conversation as `transcript.md` in the video project with numbered turns (`T1`, `T2`, …), each marked user, assistant, thinking (with its real duration), tool (server, name, input, result) or widget. Look at all of it and remove private data first.
3. **Clean up.** Write `replay.json` (format below) and `SCRIPT.md`: the beats in reading order, each with its `from` turns, plus a **Changes** list saying what was cut, merged, shortened or compressed and why. Show `SCRIPT.md` to the user and get approval before building. Approval of an earlier version does not cover a changed script.
4. **Widgets.** A widget beat shows an image of the tool's real UI (an MCP App or Apps SDK view, or a rendered result). Screenshot it with Playwright at 2× from a demo account with fictional data, save it under `assets/`, and look at it before use.
5. **Build.** After `npx hyperframes init "<project-dir>" --non-interactive --skip-skills --example=blank`, run `node chat-replay.mjs replay.json <project-dir> --force` from wherever this page's `chat-replay.mjs` lives; `--force` replaces the blank starter once. Later builds need no flag: the generated `index.html` carries a marker and is rebuilt from `replay.json` every time, so change `replay.json` and rebuild rather than editing `index.html`. `--check` validates and prints the timing without writing.
6. **Check and look.** Run `npx hyperframes check` until it reports 0 errors. Expected warnings for a 16:9 replay: `text_below_floor` (chat text is sized for desktop viewing), `film_silent` when there is no music, `line_unread` on the composer draft (and on a reply's first lines when a widget scrolls them away), and `nested_structure_needs_subcomposition`. Snapshot at the times the generator prints (each beat's end, each zoom's midpoint, 0 s for the thumbnail) and look at every frame: nothing private, the newest message in view, the zoom ring on the right element, captions readable. After rendering, look again at frames taken from the MP4 itself (`ffmpeg -ss <t> -i <file> -frames:v 1 <out>.png`): a render can differ from snapshots.
7. **Review and render** as in the main procedure. Rendering needs FFmpeg on the machine; `npx hyperframes doctor --json` reports it.

## replay.json

```json
{
  "version": 1,
  "skin": "claude",
  "aspect": "16:9",
  "source": "transcript.md",
  "title": "Directories for Example Desk",
  "connector": "Promotion Agent",
  "model": "",
  "disclosure": "Recreated from a real session",
  "pace": { "charsPerSecond": 32, "wordsPerSecond": 18 },
  "beats": [
    { "id": "ask", "type": "user", "from": "T1", "text": "Find directories worth submitting Example Desk to.", "caption": { "eyebrow": "Promotion Agent in Claude", "text": "Find directories that are actually open" } },
    { "id": "think", "type": "thinking", "from": "T2", "realSeconds": 9 },
    { "id": "search", "type": "tool", "from": ["T3", "T4"], "name": "search_directories", "input": "category: help desk software", "status": "18 candidates" },
    { "id": "answer", "type": "assistant", "from": "T6", "text": "I checked **18 directories** and **5 are open**…" },
    { "id": "table", "type": "widget", "from": "T7", "src": "assets/opportunities.png", "label": "Promotion Agent · Qualified directories" },
    { "id": "proof", "type": "focus", "target": "table", "scale": 1.2, "label": "Each one checked today" }
  ]
}
```

| Beat | Shows | Fields |
|---|---|---|
| `user` | Typed into the composer, then sent as a bubble | `text` (at most 220 characters) |
| `thinking` | "Thinking…" that settles to "Thought for Ns" (`codex`: "Working…" to "Worked for Ns" over a divider) | `realSeconds`, `duration` (screen time, default 1.2 s) |
| `tool` | A tool card with a spinner that turns into a check and a status | `name` (the real tool name), `server` (defaults to `connector`), `input`, `status`, `output` (optional result block), `duration` (default 1.4 s) |
| `assistant` | Markdown streamed word by word: paragraphs, `###` headings, lists, bold, italics, inline code and fenced code | `text`, `wps` |
| `widget` | An image of the tool's UI in a card | `src` (under `assets/`), `label`, `alt`, `duration` |
| `focus` | One eased push-in on an earlier beat, a still ring and label, then pull-back | `target` (an earlier beat's `id`), `scale` (1–1.5, default 1.25), `label` (at most 40 characters), `duration` (at least 2.4 s) |
| `pause` | Nothing new; holds the frame | `duration` |

Any beat can take `caption` (a string, or `{ "eyebrow", "text" }` with text up to 60 characters), shown from that beat until the next caption and hidden during a zoom, and `hold`, extra seconds before the next beat. Ids start with a letter. `model` (optional) is shown in the composer. `sidebar` (optional, `codex` only) names what the thread list shows around the conversation's title: `{ "project": "example-desk", "threads": ["Draft launch post"], "projects": ["docs-site"] }`, up to 4 threads and 4 projects of at most 40 characters; anything left out is a grey placeholder bar. Beats run one after another; the generator prints each beat's start and end, the total duration and the snapshot times.

## Limits of this version

Two skins (`claude`, `codex`) and one aspect (16:9). Both skins are light, so widget images should be light screenshots. Widgets are images, not live HTML. No narration or music is generated; add them through the main procedure's audio step if wanted. Long replies are slow to stream: keep each assistant beat to the gist, well under 140 words.
