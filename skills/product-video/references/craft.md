# Video craft

Part of the product video procedure. These rules decide whether a product video reads as designed or as a slideshow. They are adapted from Amanda Sartini's "12 rules for a launch video that looks like a design studio made it" (X article, 2026-10-10, https://x.com/AmandaSartini/status/2109017063205302326) and fitted to the procedure's boundaries. Its claims, privacy and approval rules win wherever they differ.

## Why videos flop

The usual failures: the logo gets the screen time instead of the product; everything moves at once so nothing reads; features are listed in text over a static screen instead of shown; the video assumes sound on although feeds autoplay muted; and the first frame is blank, so the thumbnail sells nothing. Each rule below fixes one of these.

## Structure

- **Shape.** For a 30 s promo: a hook from 0–4 s, up to six features at about 4 s each, and a 2 s closing shot. Scale the count, not the per-feature time, for other lengths. Site tours follow the same beat length, one page or flow per beat.
- **Number the features.** Give each feature beat an eyebrow such as `01 SEARCH`, `02 PROFILES`. Numbers look deliberate and tell the viewer how much is left.
- **The first frame is the thumbnail.** The hook text is on screen at 0.0 s. No fade in from white or black, no empty opening frame.
- **One contrast scene.** In the second half, dim the stage to near black for one feature (a focus mode, a goal, the moment of truth), then bring the light back for the ending. It resets attention when viewers start to scroll.
- **End on the product.** Close on the product itself (for example phone and laptop together) with one line of approved copy. No spinning logo. No call to action that is not true today, such as "download now" before launch.

## Each feature beat

- **Show it working.** Three parts: a trigger (a tap, typing, a search, an upload); the product reacting in two or three visible steps (a row appears, a bar fills, a number counts up, a card moves); and a payoff readable in one frame (the total, the check mark, the result). If nothing in the product moves for a full second, the beat is a slide, not a demo. Aim for a meaningful change about every second, then let the payoff sit still long enough to read.
- **Captions for sound off.** Each beat carries one text block in three parts: the numbered eyebrow; a two-line headline, one light line and one bold; and one sentence saying what actually happens. Keep headline lines around 14 characters and the sentence under 80. Rewrite rather than leave one word alone on a line. This text block is the caption: decide in the storyboard that no separate subtitle track is needed when every beat has one.
- **Point at the exact thing.** When the product does something clever, mark it with a small dot on the real element, a thin leader line and a short label ("Due date found"). Measure the element's box (see [frames](frames.md)); never place the dot near it by eye. Keep the label fully visible for about a second, and do not move the camera while a label is on screen.

Approved copy is often too long for 14-character lines. Propose the shortened headline and sentence in `SCRIPT.md`, next to the approved source they come from, and let the user approve them there. Never shorten into a new claim.

## Look and motion

- **Calm frame, loud product.** Keep everything around the product quiet: a warm off-white or brand-neutral background, plenty of space, one soft glow behind the device, clean type. Let the product supply the colour and the movement. Do not tint, desaturate or recolour the product's own screens; if they are muted, keep the frame even quieter rather than decorating it.
- **Move the camera like a person.** Zoom in on what is about to change, then pull back: one eased move per beat, no bounce, wobble or spin. Zoom no further than about 1.5× on a phone screen, because text goes soft beyond that. Moves take about a second; faster looks cheap and slower drags.
- **Cut on the beat.** With music, start every beat on a bar and land each tap, check and card on a beat, each with its own small sound effect. At 120 BPM a beat is 0.5 s and a bar is 2 s, which matches 4 s feature beats. Read the actual track's tempo with `npx hyperframes beats <project-dir> --json` rather than assuming 120. With narration, retime to the words first (see [audio](audio.md)) and then snap scene starts to the nearest bar.

## Data and formats

- **Believable data, real features.** Public signed-out screens are often empty or sparse. When a beat needs data, the product UI may be rebuilt in HTML from the captured design and filled with invented but believable, clearly fictional data: plausible store names, amounts, first names. Never use a real person's or customer's information, and never present invented numbers as product metrics, user counts or results. Never show a feature the product cannot do today.
- **Build once, lay out twice.** Make the vertical version from the same story and timings, never by cropping the wide one. Wide: the text block on the left, the device on the right. Vertical: the text block on top and a larger device below it.

## Pre-render checklist

Check the snapshots and contact sheet against this before asking to render:

1. The first frame says something.
2. Every beat shows the product doing something, with a change about every second and a payoff that holds still.
3. The text reads on mute: eyebrow, two short headline lines, one sentence.
4. The product has its real colour and the background does not compete with it.
5. Labels sit on the exact element and stay up about a second, with no camera move under them.
6. Cuts land on the beat.
7. There is one contrast scene.
8. It ends on the product, and every claim is approved and true today.
9. There is a vertical (or other requested aspect) version laid out, not cropped.

Test the result muted at phone size. If possible, ask someone who has not seen it what changed in each beat before locking the timing.
