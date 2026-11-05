# Video frames

Part of the product video procedure. HyperFrames' `hyperframes` skill owns how scenes are written: its render contract and "Keep it editable" rules in `SKILL.md`, `references/format.md` for scenes, attributes, media and fonts, `references/motion.md` and the per-type guide (`references/types/launch.md` for a promo or tour). This page records the limits and pitfalls met in practice.

## Scenes

Build from the SHOTS line of `SPEC.md`: one scene per sub-composition in `compositions/`, mounted from the root `index.html`, which holds only the scene hosts, media and audio. Before hand-building a named effect, transition, caption style or chart, search the registry (`hyperframes-registry` skill, `npx hyperframes catalog`) and install what fits with `npx hyperframes add`. Split a busy shot into two scenes rather than crowding one.

## Who builds the frames

Build the scenes yourself by default. Use sub-agents only for a concrete need and within the host's permissions; the skill's review step may hand a sub-agent the storyboard and contact sheets for a second opinion. Never launch another AI CLI to do it.

## Contract pitfalls

- **Ids starting with digits.** Frame ids such as `01-hook` are not valid CSS identifiers. Give authored classes and ids a letter prefix, for example `f01_hook-title`.
- **Fonts.** Only HyperFrames' bundled fonts resolve by name. Ship any other family as a file in `assets/fonts/` with `@font-face`. Capture may provide none; fetch the matching OFL fonts from Fontsource on jsDelivr and record their licence.
- **Editable clips.** Give every timed element a stable `id` written in the HTML, not created by script (lint rule `studio_missing_editable_id`).
- **Intentional overflow and overlap.** Mark deliberate camera overflow inside a window with `data-layout-allow-overflow`, and identical chrome that overlaps during crossfades with `data-layout-allow-overlap`. Do not use them to silence real collisions.
- **Safe area.** Keep content inside the 90% action-safe box and text inside the 80% title-safe box, and clear of the bottom ~17% where player controls and platform overlays sit.
- **Highlight targets.** Measure the boxes you highlight or zoom into with Playwright at the same viewport width the screenshot was captured at; do not guess coordinates.
- **Camera and callouts.** One eased camera move per beat that arrives and then holds while the UI acts, zooming no more than about 1.5× on a phone screen. Keep callout labels still and fully visible for about a second, with no camera move under them. See [video craft](craft.md).
- **Rebuilt UI.** When a beat needs the product to react and the captures are static, rebuild just that UI fragment in HTML from the captured design, keep its real labels and animate it with fictional demo data. A camera move over a frozen screenshot is not the product acting. Show only features the product has today.
- **Headline height.** Headlines are two lines by design; a third line from unexpected wrapping collides with the window below it. Lay the text block out for two lines at the longest approved headline, and cut words or move the window rather than letting it wrap or shrinking the type below the readable floor.

Snapshot each scene's midpoint as you build it, not only in the final review sheets.
