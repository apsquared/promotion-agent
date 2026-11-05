# Video audio

Part of the product video procedure. HyperFrames' `media-use` skill owns how voice, music and sound effects are found or made and how placed audio is mixed; its `hyperframes` skill's `references/sound.md` owns what a film's sound should be. This page records the order, the boundaries and the fixes found in practice. Generate voice only after the user has approved `SCRIPT.md`. Confirm before any step that would use paid credits.

## Generate

1. Run `npx hyperframes auth status` first. Signed in through `npx hyperframes auth login`, the Free plan gives the music catalog, sound effects and asset search, and about 3 minutes of Voice Turbo narration a month (the figure `media-use` gave in HyperFrames 0.9). Signed out: offline Kokoro narration (`npx hyperframes tts`) only when the user has agreed to it, text-only, or wait for the user to sign in. Never use `--api-key` on the user's behalf.
2. For a full pass, write an `audio_request.json` with one `lines` entry per narrated beat (its `id` matches the storyboard frame, its `text` the approved script line, its `sfx` the effects that beat needs) and a `bgm` block, then run `node <media-use skill dir>/audio/scripts/audio.mjs --request ./audio_request.json --out ./audio_meta.json`. It writes per-line voice files with word timestamps, the music bed and the effects. Use `--only tts,bgm,sfx` to redo one part. A single asset can come from `npx hyperframes media-use resolve --type <voice|bgm|sfx> --intent "<what>" --project .`.
3. If the music took the generate path (`bgm_pending: true` in `audio_meta.json`), wait for it with the skill's `wait-bgm.mjs` before the final render.

Text-only videos skip narration but still need a music decision from the brief. A film over about 15 s gets a music bed unless the user asked for silence or it is meant to play muted in a feed.

## Check and fix

The generated files are a starting point. Check each of these before building frames:

- **Music length against the cut.** A library track can be shorter than the video (one run got a 30 s track for a 43.7 s cut). Loop it with ffmpeg's `acrossfade` to cover the cut, enter at a strong bar rather than a quiet intro, fade it out over the last 1–2 s, and record the source track, the loop and the fade in `audio_meta.json`.
- **SFX lengths and placement.** A returned effect can be far longer than its moment (a typing sound came back 44 s long). Trim each effect to its moment and place it from the voice's word timestamps in `audio_meta.json`; `npx hyperframes audio <file> --json` shows where a file peaks, and its peak should land one frame after the picture it belongs to. Every effect needs a visible cause; rotate two or three takes of a repeated sound.
- **Retiming.** Narration usually runs longer than the estimate. Retime every scene window to the word timestamps rather than compressing the voice, and update the durations in `SPEC.md`, `STORYBOARD.md` and `BRIEF.md` to the real total.
- **Beat grid.** For a music-only cut, run `npx hyperframes beats <project-dir> --json` on the final bed, then snap each scene start to the nearest bar and land taps, checks and card arrivals on beats. When narration and the grid disagree, the words win and the scene start moves to the next bar. See [video craft](craft.md).
- **Levels.** Music under a voice sits around 0.14 volume; keep the mix around −16 to −14 LUFS with true peaks at −1 dBTP or lower (`npx hyperframes normalize-audio`). After the render, `npx hyperframes audio <video> --json` confirms the sound is present, hits where the picture hits and sits in range. Say in the report that the sound was measured, not heard.
- **Licensing.** Note where each music and SFX file came from and its licence or plan terms (Openverse effects need a CC BY credit); this goes into the assets README in the Record step.

Fades, gain, ducking and buses on placed tracks belong to `media-use` (`references/mixing.md`); follow it rather than restating it here.
