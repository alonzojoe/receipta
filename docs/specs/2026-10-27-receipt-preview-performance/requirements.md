# Receipt preview performance, and a recognisable filename

## Goal

The author, after using the deployed app:

> "receipt optimization — i notice it's a bit laggy when i view it in browser and scroll
> the generated pdf. also the file name must be the recipientname_receipt_dateandtimetoday,
> for example naming will be snake_case: joe_receipt_102720261020thensecs"

Two unrelated things in one pass: the preview scrolls badly, and the downloaded file is not
recognisable in a downloads folder.

## The filename

| | |
| --- | --- |
| Shape | `<recipient>_receipt_<MMDDYYYYHHMMSS>.<pdf\|png>` |
| Example | `juan_dela_cruz_receipt_10272026102045.pdf` |
| No recipient, or a name with no Latin letters | `receipt_10272026102045.pdf` |

**The stamp is the moment of export**, not the receipt's own date. Two exports of the same
receipt get different names rather than one silently replacing the other.

**This reverses an earlier decision deliberately.** The first version took the Receipt No.
and nothing else, specifically so a party's name could not reach a filename by
construction. The author wants the file recognisable on his own device, which is a fair
trade — but it should be recorded as a trade: **a receipt sent on is now a file whose name
carries a customer's name.** The PDF's internal metadata still carries no party name, and a
test pins that.

Everything outside `a-z` and `0-9` becomes a separator, so no dot, slash, space or
non-ASCII character can reach a path. The name is capped at 40 characters.

## The lag

The preview is a whole document — up to six pages of it — held inside a `transform: scale`,
with up to ten item photos. Each photo is stored at up to 800px on its longest edge and
painted into a 56px box, which the preview then scales again.

Three changes, all paint-side:

| Change | Why |
| --- | --- |
| `contain: layout paint style` on the preview frame | Tells the browser nothing inside affects anything outside, so it can skip the subtree when it is off screen and keep painted output inside the box. |
| `will-change: transform` on the scaled sheet | Promotes it to its own compositing layer, so scrolling moves a cached texture instead of re-rasterising a 600px document at a fractional scale every frame. The frame's `contain: paint` bounds that texture, so this is not the usual memory trap. |
| `decoding="async"` and an explicit box on the thumbnails | An 800px source painted into 56px is downsampled on every repaint. `async` keeps that off the main thread; the explicit box means no reflow around a late decode. The export needs the full source, so the image itself cannot be smaller. |

## Acceptance criteria

1. A PDF and a PNG exported for recipient `Juan Dela Cruz` are named
   `juan_dela_cruz_receipt_<14 digits>.pdf` and `.png`.
2. The stem contains only `a-z`, `0-9` and `_`, for any recipient name, including one
   containing path separators, quotes, or a non-Latin script.
3. A recipient whose name reduces to nothing produces `receipt_<14 digits>`.
4. Every part of the stamp is zero-padded, so the length never varies.
5. Two exports a second apart produce different filenames.
6. The PDF's metadata still carries no party name.
7. The preview frame declares `contain`, and the scaled sheet declares `will-change:
   transform`.
8. Item thumbnails declare an explicit width and height and `decoding="async"`.
9. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

The filename is fully verified by tests, including hostile names.

**The performance change is not measured, and cannot be from here.** No browser is
available on this project, so there is no profile before and after, and no frame timing.
What is asserted is that the declarations are present — the *reasoning* for them is sound
and standard, but **whether the lag is actually gone is for the author to judge on the
deployed site.** If it is not, the next suspects in order are: the thumbnails being 800px
sources (a smaller preview-only copy would fix it at the cost of storing two), and
`content-visibility: auto` on the frame, which was not used here because it would report a
zero height to the measuring hook and collapse the layout.

## Deferred

- Storing a small preview copy of each photo beside the full one.
- `content-visibility: auto`, which needs the measurement to stop depending on
  `offsetHeight`.
