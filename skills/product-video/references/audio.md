# Video audio

Part of the product video procedure. Generate voice only after the user has approved `SCRIPT.md`. Confirm before any step that would use paid credits.

## Generate

1. Narration: run the HyperFrames skill's `audio.mjs` with `--provider heygen` when the user is signed in through `npx hyperframes auth login` (free plan allowance), or the offline Kokoro provider when the user has agreed to install it. Never use `--api-key` on the user's behalf.
2. `node audio.mjs sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md` writes the real voice durations into the storyboard.
3. `node audio.mjs fetch-sfx --storyboard ./STORYBOARD.md --hyperframes .` resolves sound effects into the existing audio metadata.

Text-only videos skip narration but still need a music decision from the brief.

## Check and fix

The generated files are a starting point. Check each of these before building frames:

- **Music length against the cut.** A library track can be shorter than the video (one run got a 30 s track for a 43.7 s cut). Loop it with ffmpeg's `acrossfade` to cover the cut, fade it out over the last 1–2 s, and record the source track, the loop and the fade in `audio_meta.json`.
- **SFX lengths and offsets.** A returned SFX can be far longer than its moment (a typing sound came back 44 s long). Set each effect's `duration_s` and `offset_s` from the voice's word timestamps in `audio_meta.json`, so it starts and stops with the words it accompanies.
- **Retiming.** Narration usually runs longer than the estimate. Retime every scene window to the word timestamps rather than compressing the voice, and update `duration:` in `STORYBOARD.md` and `BRIEF.md` to the real total.
- **Beat grid.** Run `npx hyperframes beats <project-dir> --json` on the final music bed, then snap each scene start to the nearest bar and land taps, checks and card arrivals on beats, each with its own short SFX. When narration and the grid disagree, the words win and the scene start moves to the next bar. See [video craft](craft.md).
- **Licensing.** Note where each music and SFX file came from and its licence or plan terms; this goes into the assets README in the Record step.

Mixing (ducking, fades, gain) belongs to the HyperFrames audio skill; follow it rather than restating it here.
