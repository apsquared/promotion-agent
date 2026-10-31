# Prompt: add a product-video activity to promotion-agent (HyperFrames)

Paste everything below the line into an agent session opened at the promotion-agent repository root.

---

Add a new **`video`** marketing activity to promotion-agent. It produces short product videos (tours, promos, feature clips) for a registered product. It uses **HyperFrames** (HeyGen's HTML-to-video framework, `npx hyperframes`) when available, and falls back to a simple Playwright + ffmpeg slideshow when not. Read AGENTS.md, README.md, docs/PLAN.md, docs/HANDOFF.md and docs/ARCHITECTURE.md first, then follow the repo's existing patterns: the competitor activity (P09) and the X-growth activity are the closest models.

## Where it goes

- **Canonical procedure:** `templates/activities/video/WORKFLOW.md`, plus references beside it if it grows (for example `capture.md`, `audio.md`, `frames.md`, `fallback-slideshow.md`).
- **Route:** add a request line in `templates/WORKFLOW.md`, such as "Make a video" / "Turn the site into a demo video", with activity `video`. Add a budget/output row to "Default activity budgets and outputs" (budget: one video, or one cut plus its aspect variants, per run; output: an approved script, a rendered MP4, a contact sheet, and the evidence record).
- **Entrypoints:** thin wrappers only, all pointing at the one procedure: a Codex skill in `.agents/skills/`, a Claude Code command in `.claude/commands/`, and an OpenCode command. No logic lives in the wrappers.
- **Plan and handoff:** add the next P-milestone to `docs/PLAN.md`, then update `docs/HANDOFF.md` with evidence when done.
- **Templates and installs:** update `templates/marketing/` if TASKS/WORKFLOW templates need a `video` category note. Installed workspaces only receive the new templates through a reviewed upgrade.

## Hard boundaries (restate these in the activity)

- **Where the project lives:** the video project lives in the selected promotion workspace, at `marketing/assets/videos/<project>/`. The observed product repo stays read only. Copy a finished render into the product repo (for example `public/marketing/`) only when the user explicitly asks; then follow the product repo's own instructions, such as a README row per asset. Never commit, push or deploy.
- **No publishing:** nothing is published or scheduled. A rendered video is a draft until the user approves it, and posting it is a separate, authorized T-003-style task.
- **Claims:** on-screen copy and narration come only from approved copy or the workspace's claims guardrails (`marketing/AGENT.md`, campaign drafts). Narration may restructure approved copy but never add claims. The user approves `SCRIPT.md` before any voice is generated.
- **Privacy:** capture signed-out, public screens only. Locked or private identities, contacts and customer data must never appear. Verify every captured screen visually before using it.
- **Accounts and spending:** never create accounts, sign in, paste API keys, or trigger paid generation for the user.
  - HeyGen sign-in is the user's step (`npx hyperframes auth login`, browser OAuth). That route uses the plan's free allowance, which HyperFrames' docs put at about 10 minutes of TTS a month plus free library music and SFX search. `--api-key` bills API credits, so steer away from it.
  - Run `npx hyperframes auth status` and report it. It exits 1 when signed out, which is normal and not an error.
  - Confirm with the user before any step that would use paid credits.
- **Dependencies:** add no npm dependency to promotion-agent. HyperFrames runs on demand through `npx`. Installing its agent skills (`npx skills add heygen-com/hyperframes -g -a <agent> --skill '*' -y`) changes the user's global agent setup, so ask before doing it. Offline engines (Kokoro for voice, MusicGen for music) are optional pip installs that also need the user's consent.

## The procedure to encode

Distil this from a real run, a BuyerCue site tour built on 2026-10-10. Keep HyperFrames' own skill as the source of truth for its internals. The activity orchestrates it, adds the promotion-agent boundaries, and records the pitfalls below.

1. **Brief.** Resolve the product and workspace. Ask only what's missing, one question at a time, each with a recommended default:
   - sell or show (promo vs site tour)
   - destination → aspect (X/LinkedIn feed 1080×1080, YouTube/embed 1920×1080, Shorts 1080×1920)
   - length (30–90 s)
   - narration or text-only
   - music source
   - design source (capture brand from the site, recommended, or a HyperFrames preset)
   - storyboard review yes/no, and automation vs companion. Keep these as two separate questions.

   Write `BRIEF.md` right after `npx hyperframes init "<dir>" --non-interactive --example=blank --skill=product-launch-video`; init refuses a non-empty directory.
2. **Capture.** Run `npx hyperframes capture <url> -o ./capture --json` for the brand. Capture **every page the story needs**, not just the homepage (search, sample/profile, pricing…), into `capture-pages/<name>`, and treat a non-ok result as a hard stop.
   - Copy the chosen screens into `capture/assets/` and describe them in `capture/extracted/asset-descriptions.md`, the inventory the storyboard must draw from.
   - **Logo pitfall:** `logo-*.svg` files in the capture can be third-party directory badges. Check them visually. If they're wrong, take a high-resolution screenshot of the site's own header lockup (Playwright `locator.screenshot`, deviceScaleFactor 4) and use that.
   - Tight crops (a single section at 2×) work better for zoom shots than full pages.
3. **Design.** Pick the preset closest to the brand (for example `creative-mode` for neo-brutalist ink borders and hard shadows) and run `build-frame.mjs`. Then check the colour mapping: the run mapped the site's cream canvas (#FAF8F3) to pure white, and it had to be fixed by hand in `frame.md`.
4. **Script and storyboard.** Use a value-first arc. The on-screen headline and sub-line are the approved copy verbatim; the narration is a restructured version of it. Get the user's approval on `SCRIPT.md`. Each frame needs `type`, `persuasion`, `beat`, `blueprint`, `asset_candidates` (inventory names only) and a time-coded shot sequence, plus one `## Video direction` block. Decide captions explicitly: skip them when every frame already shows its headline and sub-line.
5. **Audio.** Run `audio.mjs --provider heygen` (or offline Kokoro), then `sync-durations`, then `fetch-sfx`. After that, check and fix:
   - **BGM length vs the cut:** the library track was 30 s for a 43.7 s cut. Loop it with an ffmpeg `acrossfade` and fade it out, and record that in `audio_meta.json`.
   - **SFX lengths and offsets:** a typing SFX came back 44 s long. Set `duration_s` and `offset_s` from the voice's word timestamps.
   - **Retiming:** narration usually runs longer than the estimate. Retime every Scene window to the word timestamps in `audio_meta.json`, and update `duration:` in STORYBOARD and BRIEF instead of fighting it.
6. **Frames.**
   - **Packet budget:** `frame-packets.mjs` rejects packets over 48 KB, so cite at most about three motion-rule recipes per frame, plus the blueprint.
   - **Who builds the frames:** frames may be built by per-frame sub-agents or by the orchestrator from the packets. Follow the repo rule of no subagents without a concrete need.
   - **Contract pitfalls hit in the run:**
     - Frame ids start with digits (`01-hook`), so authored CSS classes and ids need a letter prefix (`f01_hook-…`).
     - Fonts must ship as files with `@font-face` inside the template. Capture provides none; fetch OFL fonts from Fontsource on jsDelivr into `assets/fonts/`.
     - Give timeline clips `id`s (lint `studio_missing_editable_id`).
     - Mark intentional camera overflow inside a window with `data-layout-allow-overflow`, and identical chrome that overlaps during crossfades with `data-layout-allow-overlap`.
     - Keep all content above about 83% of the canvas height.
     - Measure highlight targets with Playwright at the **same viewport width** the screenshot was captured at, rather than guessing coordinates.
     - Headlines that wrap to two lines collide with the window below; size the type or move the window.
7. **Assemble and check.** Run `assemble-index.mjs`, then `transitions.mjs inject` and `verify`, then `npx hyperframes lint` and `npx hyperframes check` (both must reach 0 errors). Run `npx hyperframes snapshot --at <midpoints, end states, each cut −0.1/+0.2s>`, look at the contact sheets, and fix before any render.
8. **Review and render.** Run `npx hyperframes preview --background` and show the Studio URL. Ask one question: render now, or what changes? Then run `npx hyperframes render --quality high --output renders/<name>.mp4`, stop the preview, and deliver the MP4 with its duration and the contact sheet.
9. **Aspect variants.** Make a sibling project (`<project>-16x9`) that copies the first one's captures, audio, script, storyboard and timings. Change only `format`, `BRIEF.md` aspect/destination and the frame layouts; for landscape, text goes in a left column with the screenshot window on the right. Re-run checks and snapshots, then render.
10. **Record.** Do all of this in the workspace:
    - Append an activity-log entry.
    - Add an assets README with sources, capture dates, alt text and how the music was sourced or licensed.
    - File the task and evidence through the existing `record` / `complete` helpers.
    - Queue follow-ups such as the posting task or a cutdown.

## Fallback when HyperFrames isn't available

Document the no-HyperFrames path that also worked in the run:
- **Screens:** Playwright (from any local install) captures signed-out pages at 2×.
- **Slides:** HTML templates in the brand palette render to PNG slides.
- **Video:** ffmpeg builds the video with `zoompan` (about 1.035 zoom) and 0.5 s `xfade` crossfades.
- **Music:** optional and original, synthesized with numpy/scipy, so there is nothing to license.

Keep it as a short reference. It needs no accounts.

## Acceptance

- `npm run check` passes: typechecks, helper build, all tests.
- New tests cover:
  - the `video` route in WORKFLOW.md
  - all three entrypoints resolving to the one canonical procedure after relocation and installation (mirror the P09 entrypoint ownership tests)
  - a `video` task that can prepare, record a draft evidence entry pointing at a rendered MP4 and its contact sheet, and appear in the review desk while it remains open
- The package dry-run includes the new activity resources.
- Docs state plainly what is not verified by deterministic tests: HyperFrames itself, HeyGen auth, and render quality.
- Update PLAN status and HANDOFF with evidence. Make no commits unless asked.
