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
| How it is placed | **In flow, in a row with the statement**, not absolutely positioned | Tried both. Absolute positioning fills the empty right for free, and it also sat on top of a long reference number, the end of a long note, and the footer's rule - caught in review. Nothing detects that: an out-of-flow child adds no height, so the page plan sees no overflow and the overlap is silent. In flow costs the row its height and cannot overlap anything. |
| Rotation | **−5°, by `transform`**, declared once in `type_scale.ts` and pinned against the stylesheet | A stamp that is perfectly square reads as a badge. `transform` does not change the layout box, so the angle costs no height. The constant and the CSS drifted apart once (−6 against −5, with this spec quoting a third value) because nothing read the constant; a test now pins them together. |
| Shape | A square-cornered rectangle with a 3px border, with `Thank you!` **outside** the box | Matched to the author's reference image, which arrived after the first draft of this spec. A rubber stamp has a cut edge, not a rounded one, and the thanks sits under the box rather than inside it. |
| Colour | **Red**, its own `--receipt-stamp` (`#b03a2e`, 6.02:1 on the paper) | The author's instruction, and right: a stamp reads as something pressed onto the paper after the fact, where the brand violet would look printed with the document. The author then moved the Amount paid figure to ink as well, which left `--receipt-accent` unused - it is removed rather than left defined, because a dead token keeps a vacuous guard test alive. |
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
4. It is rotated by `paid_stamp_rotation_deg`, applied with `transform`, and a test pins
   the stylesheet to that constant so the two cannot drift.
5. The stamp is in flow. No rule in the document stylesheet positions it absolutely, and
   no reserved minimum height stands in for being measured.
6. On a multi-page PDF the stamp appears on the last page only, and never in the foot band
   of an earlier page.
7. The tail is still measured as one unit, and its measured height includes the stamp.
8. The document spends no violet at all. `--receipt-accent` is removed from the palette,
   and a test fails on any `var(--receipt-*)` the palette does not define, so a dangling
   reference cannot sit in the stylesheet painting nothing.
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
- **Criterion 5 is now a source-level check**, which is stronger than the arithmetic it
  replaced: the first version reserved a height calculated from an assumed 190px stamp
  width, and nothing clamped that width. Being in flow removes the assumption entirely.
- The light-versus-dark pixel diff is not re-run.

## Deferred

- Matching the author's reference image, once it is re-shared.
- **Making the stamp conditional** if partial payments or a balance-due field are ever
  added. The claim is only safe because the product cannot currently express a part-paid
  receipt.
- A distressed or textured stamp edge. It would need a raster or an SVG filter, and
  filters are another thing the rasteriser has not been proven to honour.


## What review changed

The first implementation was absolutely positioned, which filled the empty right of the
payment block for free. Review found it could sit on top of a long reference number, the
end of a long note, and the footer's rule - and that **nothing would catch it**, because an
out-of-flow child contributes no height, so `measure_layout`'s overflow check sees a page
that fits.

The reserved `min-height` that was meant to make it safe only guaranteed the block was tall
enough to contain the stamp. It said nothing about the content the stamp was laid over, and
its 92px came from arithmetic on an assumed stamp width that nothing enforced.

It is now in flow, in a row with the statement. The row is as tall as the stamp, which is
the price, and in exchange the overlap is not possible rather than merely unlikely.
