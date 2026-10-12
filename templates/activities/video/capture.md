# Video capture

Part of the product video procedure. Run from the video project directory. Capture signed-out, public pages only.

## Brand and pages

1. Run `npx hyperframes capture <site-url> -o ./capture --json` for the brand: colours, fonts, logo candidates and the homepage. Treat any non-ok result as a hard stop; report it rather than building from a partial capture.
2. Capture every page the story needs, not only the homepage (for example search, a public sample or profile, pricing), each into `capture-pages/<name>` with the same command. Each non-ok result is also a hard stop.
3. Look at every captured screenshot. Discard any that show a signed-in state, private or locked identities, contact details, customer data or a cookie banner covering content.

## Inventory

Copy the chosen screens into `capture/assets/` and describe each in `capture/extracted/asset-descriptions.md`: file name, page URL, capture date, what it shows and what it is good for (hero, zoom target, proof shot). This file is the inventory the storyboard's `asset_candidates` must draw from; a frame cannot cite an asset that is not listed.

## Logo pitfall

`logo-*.svg` files in a capture can be third-party directory or award badges rather than the product's own logo. Open each one. If none is the product's lockup, take a high-resolution screenshot of the site's own header lockup with Playwright: `page.locator(<header logo selector>).screenshot()` in a context with `deviceScaleFactor: 4`. Use that file and note its source in the inventory.

## Crops for zoom shots

Tight crops of a single section at 2× (a search box, one result card, a pricing tier) work better for zoom and highlight shots than full-page screenshots. Take them with Playwright at the same viewport width as the page capture so coordinates stay comparable, and add them to the inventory.

Playwright from any existing local install is enough; do not add it as a project dependency.
