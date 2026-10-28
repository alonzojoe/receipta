# Screenshots

The four images the project README shows. Capture them from
[receipta-app.netlify.app](https://receipta-app.netlify.app) and drop them in this folder
with these exact names — the README already points at them.

| File | What | How |
| --- | --- | --- |
| `desktop-home.png` | The home page, hero visible, including the receipt sheet | Mac: a browser window about 1440 wide, then `⌘ ⇧ 4` then `Space` to grab the window |
| `mobile-builder.png` | `/create`, mid-build, with a couple of items filled in | iPhone: side button + volume up |
| `mobile-preview.png` | The Review step showing the receipt preview | iPhone, same |
| `receipt.png` | An exported receipt itself | Open the downloaded PDF and screenshot a page, or use the PNG export directly |

A few things worth getting right, since these are the first thing anyone sees:

- **Use realistic data, not `asdf`.** A receipt from "Mabini Print Shop" to "Maria Santos"
  for two tarpaulins reads as a product; one full of test strings reads as a prototype.
- **Use a real payment method** so its logo shows.
- **Include a discount with a description**, so `Discount (regular client)` appears.
- **One item with a photo** shows the thumbnail column doing its job.
- **Light mode for the home page shot** unless the dark one looks better to you — but then
  take the mobile ones in the same theme, so the three sit together.
- **No real customer names or reference numbers.** These go in a public repository.

Keep each file under about 500 KB. A PNG from a Retina screen is often 2–3 MB; running it
through any compressor is enough, and the README renders them at a third of the width
anyway.

## Why these are not generated automatically

Browser automation is switched off for this project, so nothing here can open a page and
capture it. A third-party screenshot service could render the live site into the README, but
that would put an external request into a repository whose whole claim is that it makes
none, and the image would break the day that service changes or rate-limits.

Committed files it is.
