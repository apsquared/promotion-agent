---
name: product-video
description: Make a short product video (site tour, launch promo or feature clip) from a product's public website, using HyperFrames when available and a Playwright + ffmpeg slideshow otherwise. Use for demo videos, product tours, launch promos, and square, wide or vertical variants of an existing cut.
license: MIT
---

# Product video

Make one short product video as a reviewable draft: an approved script, a rendered MP4 and a contact sheet. Rendering does not publish, schedule or deploy anything.

HyperFrames (HeyGen's HTML-to-video framework, run on demand with `npx hyperframes`) is the preferred engine. Its own skills are the source of truth for its internals: `hyperframes` (render contract, work loop, story, spec and review, and per-type guides such as `references/types/launch.md`), `hyperframes-cli` (commands and their JSON), `hyperframes-registry` (ready-made blocks, transitions and captions) and `media-use` (voice, music, sound effects, images and logos). Since HyperFrames 0.9 these replace the retired `product-launch-video` and `hyperframes-core` skills and their frame-packet scripts; ignore older instructions that name them. This skill orchestrates that work, adds boundaries and records pitfalls found in practice. When HyperFrames is unavailable, use the [fallback slideshow](references/fallback-slideshow.md), which needs no accounts. Whatever the engine, follow [video craft](references/craft.md) for structure, captions, motion and the pre-render checklist.

For a product used through an AI assistant (its MCP server or plugin in Claude or ChatGPT), make a [chat replay](references/chat-replay.md) instead of a screen recording: a real transcript cleaned to its gist and rendered by [chat-replay.mjs](references/chat-replay.mjs) in a chat-app skin, under its own honesty rules. Its brief, script and build steps replace capture, design, storyboard and frames below; the boundaries, approval, checks, review, render and record steps still apply.

Inside a promotion-agent workspace, use its `video` activity instead; it adds task tracking and evidence on top of this procedure.

## Hard boundaries

- **Where the project lives.** Keep the video project in its own directory, outside the product's repository by default (recommended: `~/product-videos/<project>/`). Use another location only when the user chooses it. Treat the product repository as read only. Copy a finished render into it (for example `public/marketing/`) only when the user explicitly asks, then follow that repository's own instructions. Never commit, push or deploy.
- **No publishing.** Nothing is published or scheduled. A rendered video is a draft until the user approves it; posting it is a separate request.
- **Claims.** On-screen copy and narration come only from copy the user supplies or approves, or the product's own published wording. Narration may restructure that copy but never adds a claim. The user approves `SCRIPT.md` before any voice is generated or frames are built.
- **Privacy.** Capture signed-out, public screens only. Private identities, contacts and customer data must never appear. Look at every captured screen before using it.
- **Accounts and spending.** Never create accounts, sign in, paste API keys or trigger paid generation for the user.
  - HeyGen sign-in is the user's step: `npx hyperframes auth login` (browser OAuth). That route uses the Free plan's allowance, which HyperFrames' `media-use` skill puts at about 3 minutes of Voice Turbo narration a month plus the music catalog, sound effects and asset search. `--api-key` bills API credits; steer away from it.
  - Run `npx hyperframes auth status` and report the result. It exits 1 when signed out; that is normal, not an error.
  - Confirm with the user before any step that would use paid credits.
- **Dependencies.** Add no dependency to the user's projects; HyperFrames runs through `npx`. Installing or updating HyperFrames' agent skills changes the user's global agent setup and is the user's step: name the command (`npx hyperframes skills update` for the core set, or `npx skills add heygen-com/hyperframes --all` when the HyperFrames CLI is unavailable) and do not run it yourself. Offline engines (Kokoro for voice, MusicGen for music) are optional pip installs that also need the user's consent.
- **Agents.** Do not launch another AI CLI. Build frames yourself unless a concrete need justifies sub-agents within the host's permissions.

## Check availability

1. Identify the product and its public site. Ask for the URL if it is not clear.
2. Check `npx hyperframes doctor --json` (it exits 0; read its `ok` field), `npx hyperframes skills check --json` (read only; it lists each skill as current, outdated or missing) and `npx hyperframes auth status`. Report what is available. A missing or outdated core skill (`hyperframes`, `hyperframes-cli`, `hyperframes-registry`, `media-use`): tell the user to run `npx hyperframes skills update`, and keep working from the installed skills, not remembered ones. When resuming a project whose `package.json` pins a HyperFrames version, probe it with `npx hyperframes@latest upgrade --project . --check` and follow the `hyperframes` skill's `references/skill-lifecycle.md`. Signed out: text-only, offline Kokoro (with consent), or wait for the user's sign-in.
3. If HyperFrames cannot run, say why and offer the [fallback slideshow](references/fallback-slideshow.md).

## 1. Brief

Ask only what is missing, one question at a time, each with a recommended default:

| Question | Recommended default |
|---|---|
| Sell or show? | Promo for a launch; site tour when the user says "tour" or "demo" |
| Destination → aspect | X/LinkedIn feed 1080×1080; YouTube or embed 1920×1080; Shorts/Reels 1080×1920 |
| Length | 30 s for a promo (hook, up to six 4 s features, close); 45–60 s for a site tour (range 30–90 s) |
| Narration or text-only | Text-only built for sound off; add narration when signed in or Kokoro is available and the user wants it |
| Music source | The HeyGen music catalog (free when signed in), cut on its beat; original or none for the fallback |
| Design source | Capture the brand from the site; HyperFrames' presets are deck looks, used only when the user names one |
| Storyboard review | Yes |
| Automation or companion | Automation, with review stops at the script and before render |

Keep storyboard review and automation-versus-companion as two separate questions. Then run `npx hyperframes init "<dir>" --non-interactive --skip-skills --skill=hyperframes` (`--skip-skills` stops init from installing HyperFrames' skills globally on its own; that install is the user's decision) and write `BRIEF.md` immediately after: init refuses a non-empty directory.

## 2. Capture

Follow [capture](references/capture.md): the brand capture, every page the story needs, the asset inventory, logo checks and tight crops. A non-ok capture is a hard stop.

## 3. Design

Keep the frame calm and let the product supply colour and motion ([video craft](references/craft.md)). Take the look from the capture (its screenshots, `extracted/tokens.json` and `extracted/design-styles.json`) as the `hyperframes` skill's `references/look.md` describes, and write it as numbers in the LOOK line of `SPEC.md` (step 4). Quote the brand's hex values and font families exactly and never round them: a cream canvas such as `#FAF8F3` is not `#FFFFFF`. A HyperFrames preset is a slide-deck look; use one only when the user names it, by copying its `FRAME.md` to the project root as `frame.md`.

## 4. Script and storyboard

For a film over about 15 s, start with the `hyperframes` skill's `references/story.md`: three storylines that are three different films, in words only, recommendation first, saved as `STORYLINES.md`. The user picks one; in automation mode take the recommendation and name the other two in one line each. Where the skill's guidance and [video craft](references/craft.md) differ, follow video craft and the claims boundary.

Use a value-first arc built on the [video craft](references/craft.md) structure: a hook that is on screen in the first frame, numbered feature beats that each show a trigger, the product reacting and a readable payoff, one contrast scene in the second half, and a closing shot of the product with one line of approved copy. No logo ending, and no call to action that is not true today. Each beat's text block (eyebrow, two-line headline, one sentence) comes from approved copy; where it must be shortened to fit, put the shortened text beside its source in `SCRIPT.md`. Narration restructures the same copy and adds nothing. Show `SCRIPT.md` with each line's source to the user and **get approval before generating any voice or building frames**. Approval of earlier wording does not cover a changed script. Then write the picked storyline as `SPEC.md` (the skill's `references/spec.md`): every adjective turned into a number, a BANNED line and one SHOTS line per shot.

In `STORYBOARD.md`, follow the skill's `references/storyboard-format.md`: frontmatter with `format`, `duration`, `message` and `arc`, then one `## Frame N — Title` per shot with `duration`, `scene`, `reads`, `sound` and `voiceover` bullets, plus an `assets` bullet naming inventory entries only (from `capture/extracted/asset-descriptions.md`). Decide captions explicitly: when every beat carries its eyebrow, headline and sentence, that text is the caption and no separate subtitle track is needed; say so. Plan beats on a 2 s bar grid (120 BPM) to be snapped to the real track in the audio step, and list any invented demo data; it must be fictional and never a real person's information. If the brief asked for storyboard review, pose the stills on `boards/storyboard.html` and stop for the user's go, as the skill's `references/storyboard.md` describes.

## 5. Audio

Follow [audio](references/audio.md): check sign-in, generate voice, music and effects through `media-use`, then fix music length, SFX lengths and placement, retime to the real narration and snap to the beat grid.

## 6. Frames

Follow [frames](references/frames.md): one scene per sub-composition, the registry before hand-building, who builds the frames, camera and callout limits, rebuilt UI and the composition contract pitfalls.

## 7. Assemble and check

Mount every scene in the root `index.html` (`data-composition-src`) at its planned start. Run `npx hyperframes lint` while writing and `npx hyperframes check --json` as the gate: fix every error, and fix each warning or keep it on purpose and say why (for example `film_silent`, `line_unread`, `dead_stretch`, `text_below_floor`, `first_frame_empty`). Then run `npx hyperframes snapshot --review` (each scene just after its start and at its middle, a strip across every cut, and the beat frames at phone width) and `npx hyperframes snapshot --at 0` for the thumbnail, and review them as the skill's `references/review.md` describes, ending in `REVIEW.md`. Look at the contact sheets yourself and fix collisions, clipped text, empty frames, wrong logos and private data, then go through the [pre-render checklist](references/craft.md#pre-render-checklist) before any render.

## 8. Review and render

Run `npx hyperframes preview --background` and show the user the Studio URL. Ask one question: render now, or what should change? After approval, run `npx hyperframes render --quality delivery --output renders/<name>.mp4`, stop the preview, look at frames decoded from the MP4 rather than only the snapshots, check its sound with `npx hyperframes audio <mp4> --json` when it has any, and deliver the MP4 path with its duration (from `ffprobe`) and the contact sheet. The render is still a draft.

## 9. Aspect variants

For another destination, make a sibling project `<project>-16x9` (or `-9x16`) that copies the first one's captures, audio, script, storyboard and timings. Change only `format`, the aspect and destination in `BRIEF.md`, and the frame layouts. Lay the same story out again rather than cropping: for landscape, the text block in a left column and the device or screenshot window on the right; for vertical, the text block on top and a larger device below. Re-run check and the review snapshots, look at them, then render. One run makes one video, or one cut plus its aspect variants.

## 10. Record

In the video project directory, write a `README.md` with a row per render: path, duration, aspect, sources and capture dates, alt text or a one-line description, and how the music and fonts were sourced or licensed.

Report the brief, script approval, auth status and any credit use, the render paths and durations, what was checked and what was not, and the natural next steps (posting copy for the chosen destination, an aspect variant or a cutdown). Do not post or schedule anything.
