# replay.json

The cleaned-up session the [generator](../scripts/chat-replay.mjs) turns into a HyperFrames composition. Top-level fields set the skin, chrome and pace; every sourced beat cites the transcript turns it came from. The [examples](../examples/replay.json) build as they are.

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

## Limits

Two skins (`claude`, `codex`) and one aspect (16:9). Both skins are light, so widget images should be light screenshots. Widgets are images, not live HTML. No narration or music is generated; add them to the HyperFrames project afterwards if wanted. Long replies are slow to stream: keep each assistant beat to the gist, well under 140 words.
