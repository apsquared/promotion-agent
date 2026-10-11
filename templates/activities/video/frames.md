# Video frames

Part of the [video activity](WORKFLOW.md). HyperFrames' composition contract (`hyperframes-core`) and the `product-launch-video` skill own how frames are written; this page records the limits and pitfalls met in practice.

## Packets

The skill's `frame-packets.mjs` builds one packet per frame and rejects any packet over 48 KB. Cite at most about three motion-rule recipes per frame plus its blueprint; split a busy frame rather than trimming its packet by hand.

## Who builds the frames

Frames may be built by per-frame sub-agents or by the orchestrating agent from the packets. promotion-agent's rule is no sub-agents without a concrete need, so build them yourself by default. Never launch another AI CLI to do it.

## Contract pitfalls

- **Ids starting with digits.** Frame ids such as `01-hook` are not valid CSS identifiers. Give authored classes and ids a letter prefix, for example `f01_hook-title`.
- **Fonts.** Ship fonts as files with `@font-face` inside the template. Capture provides none; fetch the matching OFL fonts from Fontsource on jsDelivr into `assets/fonts/` and record their licence.
- **Editable clips.** Give every timeline clip an `id` (lint rule `studio_missing_editable_id`).
- **Intentional overflow and overlap.** Mark deliberate camera overflow inside a window with `data-layout-allow-overflow`, and identical chrome that overlaps during crossfades with `data-layout-allow-overlap`. Do not use them to silence real collisions.
- **Safe area.** Keep all content above about 83% of the canvas height, clear of player controls and platform overlays.
- **Highlight targets.** Measure the boxes you highlight or zoom into with Playwright at the same viewport width the screenshot was captured at; do not guess coordinates.
- **Wrapping headlines.** A headline that wraps to two lines collides with the screenshot window below it. Size the type for the longest approved line, or move the window.

Check each frame in snapshots before assembly, not only in the final contact sheet.
