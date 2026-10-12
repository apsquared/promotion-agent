---
name: product-video
description: Make a short product video (site tour, launch promo or feature clip) from a product's public website, using HyperFrames when available and a Playwright + ffmpeg slideshow otherwise. Use for demo videos, product tours, launch promos, and square, wide or vertical variants of an existing cut.
license: MIT
---

# Product video

Make one short product video as a reviewable draft: an approved script, a rendered MP4 and a contact sheet. Rendering does not publish, schedule or deploy anything.

HyperFrames (HeyGen's HTML-to-video framework, run on demand with `npx hyperframes`) is the preferred engine. Its own skills, chiefly `product-launch-video`, are the source of truth for its internals: composition contract, scripts, presets and motion rules. This skill orchestrates that work, adds boundaries and records pitfalls found in practice. When HyperFrames is unavailable, use the [fallback slideshow](references/fallback-slideshow.md), which needs no accounts. Whatever the engine, follow [video craft](references/craft.md) for structure, captions, motion and the pre-render checklist.

Inside a promotion-agent workspace, use its `video` activity instead; it adds task tracking and evidence on top of this procedure.

## Hard boundaries

- **Where the project lives.** Keep the video project in its own directory, outside the product's repository by default (recommended: `~/product-videos/<project>/`). Use another location only when the user chooses it. Treat the product repository as read only. Copy a finished render into it (for example `public/marketing/`) only when the user explicitly asks, then follow that repository's own instructions. Never commit, push or deploy.
- **No publishing.** Nothing is published or scheduled. A rendered video is a draft until the user approves it; posting it is a separate request.
- **Claims.** On-screen copy and narration come only from copy the user supplies or approves, or the product's own published wording. Narration may restructure that copy but never adds a claim. The user approves `SCRIPT.md` before any voice is generated or frames are built.
- **Privacy.** Capture signed-out, public screens only. Private identities, contacts and customer data must never appear. Look at every captured screen before using it.
- **Accounts and spending.** Never create accounts, sign in, paste API keys or trigger paid generation for the user.
  - HeyGen sign-in is the user's step: `npx hyperframes auth login` (browser OAuth). That route uses the plan's free allowance, which HyperFrames' docs put at about 10 minutes of TTS a month plus free library music and SFX search. `--api-key` bills API credits; steer away from it.
  - Run `npx hyperframes auth status` and report the result. It exits 1 when signed out; that is normal, not an error.
  - Confirm with the user before any step that would use paid credits.
- **Dependencies.** Add no dependency to the user's projects; HyperFrames runs through `npx`. Installing HyperFrames' agent skills (`npx skills add heygen-com/hyperframes -g -a <agent> --skill '*' -y`) changes the user's global agent setup, so ask first. Offline engines (Kokoro for voice, MusicGen for music) are optional pip installs that also need the user's consent.
- **Agents.** Do not launch another AI CLI. Build frames yourself unless a concrete need justifies sub-agents within the host's permissions.

## Check availability

1. Identify the product and its public site. Ask for the URL if it is not clear.
2. Check `npx hyperframes doctor --json` (it exits 0; read its `ok` field), whether the HyperFrames skills are installed for this agent, and `npx hyperframes auth status`. Report what is available. Missing skills: ask before the global install. Signed out: text-only, offline Kokoro (with consent), or wait for the user's sign-in.
3. If HyperFrames cannot run, say why and offer the [fallback slideshow](references/fallback-slideshow.md).

## 1. Brief

Ask only what is missing, one question at a time, each with a recommended default:

| Question | Recommended default |
|---|---|
| Sell or show? | Promo for a launch; site tour when the user says "tour" or "demo" |
| Destination → aspect | X/LinkedIn feed 1080×1080; YouTube or embed 1920×1080; Shorts/Reels 1080×1920 |
| Length | 30 s for a promo (hook, up to six 4 s features, close); 45–60 s for a site tour (range 30–90 s) |
| Narration or text-only | Text-only built for sound off; add narration when signed in or Kokoro is available and the user wants it |
| Music source | HyperFrames free library, cut on its beat; original or none for the fallback |
| Design source | Capture the brand from the site; a HyperFrames preset otherwise |
| Storyboard review | Yes |
| Automation or companion | Automation, with review stops at the script and before render |

Keep storyboard review and automation-versus-companion as two separate questions. Then run `npx hyperframes init "<dir>" --non-interactive --example=blank --skill=product-launch-video` and write `BRIEF.md` immediately after: init refuses a non-empty directory.

## 2. Capture

Follow [capture](references/capture.md): the brand capture, every page the story needs, the asset inventory, logo checks and tight crops. A non-ok capture is a hard stop.

## 3. Design

Keep the frame calm and let the product supply colour and motion ([video craft](references/craft.md)). Pick the HyperFrames preset closest to the brand (for example `creative-mode` for neo-brutalist ink borders and hard shadows) and run the skill's `build-frame.mjs`. Then check the colour mapping in `frame.md` against the captured site: a near-white canvas can be mapped to pure white (one run mapped cream `#FAF8F3` to `#FFFFFF`) and must be fixed by hand.

## 4. Script and storyboard

Use a value-first arc built on the [video craft](references/craft.md) structure: a hook that is on screen in the first frame, numbered feature beats that each show a trigger, the product reacting and a readable payoff, one contrast scene in the second half, and a closing shot of the product with one line of approved copy. No logo ending, and no call to action that is not true today. Each beat's text block (eyebrow, two-line headline, one sentence) comes from approved copy; where it must be shortened to fit, put the shortened text beside its source in `SCRIPT.md`. Narration restructures the same copy and adds nothing. Show `SCRIPT.md` with each line's source to the user and **get approval before generating any voice or building frames**. Approval of earlier wording does not cover a changed script.

In `STORYBOARD.md`, give each frame `type`, `persuasion`, `beat`, `blueprint`, `asset_candidates` (inventory names only, from `capture/extracted/asset-descriptions.md`) and a time-coded shot sequence, plus one `## Video direction` block. Decide captions explicitly: when every beat carries its eyebrow, headline and sentence, that text is the caption and no separate subtitle track is needed; say so. Plan beats on a 2 s bar grid (120 BPM) to be snapped to the real track in the audio step, and list any invented demo data; it must be fictional and never a real person's information. Offer the storyboard for review if the brief asked for it.

## 5. Audio

Follow [audio](references/audio.md): generate, sync durations, fetch SFX, then fix music length, SFX lengths and offsets, retime to the real narration and snap to the beat grid.

## 6. Frames

Follow [frames](references/frames.md): packet budget, who builds the frames, camera and callout limits, rebuilt UI and the composition contract pitfalls.

## 7. Assemble and check

Run the skill's `assemble-index.mjs`, then `transitions.mjs inject` and `transitions.mjs verify`, then `npx hyperframes lint` and `npx hyperframes check`; both must reach 0 errors. Run `npx hyperframes snapshot --at <times>` at 0.0 s for the thumbnail, each frame's midpoint and end state, and each cut at −0.1 s and +0.2 s. Look at the contact sheets yourself and fix collisions, clipped text, empty frames, wrong logos and private data, then go through the [pre-render checklist](references/craft.md#pre-render-checklist) before any render.

## 8. Review and render

Run `npx hyperframes preview --background` and show the user the Studio URL. Ask one question: render now, or what should change? After approval, run `npx hyperframes render --quality high --output renders/<name>.mp4` (`high` is the same as `delivery`), stop the preview, and deliver the MP4 path with its duration (from `ffprobe`) and the contact sheet. The render is still a draft.

## 9. Aspect variants

For another destination, make a sibling project `<project>-16x9` (or `-9x16`) that copies the first one's captures, audio, script, storyboard and timings. Change only `format`, the aspect and destination in `BRIEF.md`, and the frame layouts. Lay the same story out again rather than cropping: for landscape, the text block in a left column and the device or screenshot window on the right; for vertical, the text block on top and a larger device below. Re-run lint, check and snapshots, look at them, then render. One run makes one video, or one cut plus its aspect variants.

## 10. Record

In the video project directory, write a `README.md` with a row per render: path, duration, aspect, sources and capture dates, alt text or a one-line description, and how the music and fonts were sourced or licensed.

Report the brief, script approval, auth status and any credit use, the render paths and durations, what was checked and what was not, and the natural next steps (posting copy for the chosen destination, an aspect variant or a cutdown). Do not post or schedule anything.
