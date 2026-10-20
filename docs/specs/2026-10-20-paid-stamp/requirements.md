# Paid-in-full stamp

## Goal

The author, looking at a real export:

> "stamp in lower right of the receipt — as you can see there is a big space in there, you
> can put a stamp there like this. PAID IN FULL and thank you, i think this is good?"

A reference image was supplied but the path was a macOS temp file that had already been
cleared, so **the stamp below is designed from the description, not matched to a
reference.** If the author wants it matched, the image needs re-sharing and this is one
block to restyle.

## Is the claim true?

A stamp that says PAID IN FULL is an assertion about the money, so it has to be one this
product can always make honestly.

It can. A Receipta receipt records a payment that has already happened: there is exactly
one payment method, no partial-payment concept, and the amount paid is the total after any
discount. There is no state in which a receipt exists and the claim is false. **If a
partial-payment or balance-due feature is ever added, this stamp must become conditional
on the same day** — that is recorded in Deferred rather than left to be discovered.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Where | **Right-aligned in the tail, between the statement and the footer**, on the last page only | It is the empty area the author pointed at, and the tail is where the money has just been stated. It belongs with the total, not floating in the page. |
| How it is placed | **A measured block in normal flow**, not absolutely positioned | Pagination measures every unit it deals out. An absolutely positioned stamp has no height, so a page would be planned as if it were not there and the stamp would land on top of the footer. This is the same reason the document forbids margins. |
| Rotation | **−6°, by `transform`** | A stamp that is perfectly square reads as a badge, not a stamp. `transform` does not change the layout box, so the measured height is unaffected; the box carries enough padding that the rotated ink stays inside it. |
| Shape | A rounded rectangle with a 2px border, not an oval or a circle | Two lines of text at different sizes fit a rectangle. An oval would force either a tiny second line or a very wide stamp. |
| Colour | **Violet**, `--receipt-accent` | It is the one mark on the document that is meant to be noticed after the amount. This makes two uses of the accent, up from one; the author's "three violet touches" rule is not broken. |
| Words | `PAID IN FULL` over `Thank you` | The author's words. Uppercase and tracked on the first line because that is what a stamp looks like; sentence case on the second because it is a human line, not a label. |
| On multi-page PDFs | **Last page only** | It belongs with the total. A stamp on every page would read as a watermark and would compete with the running header. |

## Scope

In scope: `receipt_blocks.tsx` (the tail), `receipt_document.css`, `type_scale.ts` for the
stamp's sizes, and the tests that pin the document's structure and its violet uses.

Out of scope: the preview's own chrome, the export pipeline, pagination logic, and the
app's theme. The stamp is part of the document, so it appears in the preview and in both
exports without any of those changing.

## Acceptance criteria

1. The document shows the stamp once, after the statement and before the footer.
2. It reads `PAID IN FULL` on the first line and `Thank you` on the second.
3. It is right-aligned within the content column.
4. It is rotated by a small negative angle, applied with `transform` so the layout box and
   therefore the measured height are unchanged.
5. The rotated ink stays inside the element's own box: the box's padding is large enough
   that no part of the border or text is painted outside it at the chosen angle.
6. On a multi-page PDF the stamp appears on the last page only, and never in the foot band
   of an earlier page.
7. The tail is still measured as one unit, and its measured height includes the stamp.
8. `--receipt-accent` is used in exactly two places in the document stylesheet: the
   "Amount paid" figure and the stamp. The existing test that pins that list is updated,
   not deleted.
9. No margin is introduced anywhere in the document stylesheet.
10. Nothing below 13px, and every line height a whole pixel.
11. The white-paper guarantee is unaffected: no `dark:` variant, no theme token, and the
    stamp's colours come from `--receipt-*` only.
12. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

No browser is available (author instruction), so:

- Criteria 1, 2, 3, 6, 7, 8, 9, 10 and 11 are verified by tests over the rendered DOM and
  the stylesheet source.
- **Criterion 4's `transform` is a real risk that cannot be verified here.** The export
  spike proved `object-fit`, WebP and the peso glyph rasterise, but **it never tested a
  `transform`.** If `html2canvas-pro` does not honour rotation, the stamp renders square —
  which is a cosmetic miss, not a broken document, and the layout is unaffected either way
  because the box is unrotated. Recorded as unverified rather than claimed.
- **Criterion 5 cannot be measured in jsdom.** The padding is derived from the geometry of
  rotating a box of known size, stated in the validation notes as arithmetic rather than
  measurement, for the author to confirm on screen.
- The light-versus-dark pixel diff is not re-run.

## Deferred

- Matching the author's reference image, once it is re-shared.
- **Making the stamp conditional** if partial payments or a balance-due field are ever
  added. The claim is only safe because the product cannot currently express a part-paid
  receipt.
- A distressed or textured stamp edge. It would need a raster or an SVG filter, and
  filters are another thing the rasteriser has not been proven to honour.
