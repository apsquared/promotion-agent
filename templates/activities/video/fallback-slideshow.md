# Fallback slideshow

Part of the [video activity](WORKFLOW.md). Use this when HyperFrames is unavailable or the user prefers not to install it. It needs no accounts and adds no promotion-agent dependency. The same boundaries apply: the project lives in `marketing/assets/videos/<project>/`, copy comes from approved sources, the user approves the script first, and the result is a draft.

1. **Screens.** Use Playwright from any existing local install to capture signed-out public pages at `deviceScaleFactor: 2`. Look at every screenshot and discard any with private data.
2. **Slides.** Write small HTML templates in the brand palette (headline, sub-line, screenshot) using approved copy verbatim, and render each to a PNG at the target aspect with Playwright.
3. **Video.** Build the video with ffmpeg: a gentle `zoompan` push on each slide (about 1.035× over the slide) and 0.5 s `xfade` crossfades between slides, encoded as H.264 MP4 with `yuv420p`.
4. **Music.** Optional. Synthesize an original bed with numpy/scipy (simple chords and a soft pulse) so there is nothing to license, or leave the video silent. Narration is out of scope here unless the user supplies an approved recording.
5. **Check.** Extract a contact sheet with ffmpeg (`fps` plus `tile`), look at it, and check the duration with `ffprobe`.

Then continue with the Record step of the activity.
