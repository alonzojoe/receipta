# Screenshots

The four images the project README shows. Capture them from
[receipta-app.netlify.app](https://receipta-app.netlify.app) and put them here under these
exact names — the README already points at them.

| File | What | In a phone frame? |
| --- | --- | --- |
| `desktop-home.png` | The home page, hero visible, including the receipt sheet | No — it is a browser window |
| `mobile-builder.png` | `/create`, mid-build, a couple of items filled in | **Yes** |
| `mobile-preview.png` | The Review step showing the receipt preview | **Yes** |
| `receipt.png` | An exported receipt itself | No — it is a document, not a screen |

## Capturing

- **Mac**: `⌘ ⇧ 4` then `Space` grabs a whole window cleanly, at about 1440 wide.
- **iPhone**: side button + volume up.
- **The receipt**: open the downloaded PDF and screenshot a page, or just use the PNG export.

## The phone frame

The two mobile shots go through `scripts/phone_mockup.sh`, which wraps a raw screenshot in a
phone-shaped frame — rounded screen, dark bezel, soft shadow, transparent background:

```bash
scripts/phone_mockup.sh ~/Desktop/IMG_0001.PNG docs/screenshots/mobile-builder.png
scripts/phone_mockup.sh ~/Desktop/IMG_0002.PNG docs/screenshots/mobile-preview.png
```

It needs ImageMagick (`brew install imagemagick`) and takes an optional third argument for
the screen width, which defaults to 900. The proportions are derived from that width, so any
screenshot size produces the same-looking phone.

It is local on purpose. A mockup website would be quicker and would also mean uploading
screenshots of a receipt to someone else's server, which is a strange thing to do for a
project whose whole claim is that nothing leaves your device.

## Getting the content right

These are the first thing anyone sees, so the data in them matters more than the framing:

- **Use realistic data, not `asdf`.** A receipt from "Mabini Print Shop" to "Maria Santos"
  for two tarpaulins reads as a product; one full of test strings reads as a prototype.
- **Use a real payment method** so its logo shows.
- **Include a discount with a description**, so `Discount (regular client)` appears.
- **One item with a photo**, so the thumbnail column is doing something.
- **Keep the theme consistent** across all four, so they sit together.
- **No real customer names or reference numbers.** This is a public repository.

Keep each file under about 500 KB. A PNG from a Retina screen is often 2–3 MB; any
compressor will do, and the README renders them at a third of its width anyway.

## Why these are not generated automatically

Browser automation is switched off for this project, so nothing here can open a page and
capture it. A third-party screenshot service could render the live site straight into the
README, but that would put an external request into a repository whose whole claim is that it
makes none, and the image would break the day that service changes or rate-limits.

Committed files it is.
