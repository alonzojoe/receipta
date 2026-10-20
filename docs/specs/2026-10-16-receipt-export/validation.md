# Validation: receipt export

Result against the 77 criteria of `requirements.md`, as amended. Criteria 1, 2, 4, 10 and 11
are judged as their restatements (1', 2', 4', 10', 11') because the author redesigned the
layout mid-build; see the spec's "Amendment after the layout redesign".

## How this was measured

- **Browser.** Chrome for Testing 151.0.7922.34 (headless, macOS arm64), driven over the
  DevTools protocol, against the **Vite dev server**, not a production build. Real
  `html2canvas-pro` 2.5.0 and `jsPDF` 4.2.1, real fonts, real downloads written to disk and read
  back. Every file below was opened and decoded after it was written, not inferred from a log.
- **Two harnesses.** The real `/create` page, with a draft seeded at step 4 and the real Review
  buttons pressed (theme, focus, network, responsive, light-versus-dark). And a throwaway page
  mounting the real `ReceiptExportPanel` with the real ports wrapped, so a limit could be forced
  and a bad canvas injected without editing a source file. Both were deleted; nothing in `src`
  was edited for a measurement.
- **Pixels.** PNGs were decoded in Node (zlib, all five PNG filters) and compared
  pixel for pixel. PDFs were read for page size, page count, title, embedded image sizes and the
  placement matrix. Page rasters were captured at the `assemble_pdf` port (the exact bytes
  embedded) and looked at.
- **Unit tests** are the evidence for the pure criteria. They were run, and for the new ones and
  a sample of the builder's the guarded behaviour was mutated to confirm the test goes red (table
  at the end).

Who checked what is stated per row: **QA** means I measured it myself in the browser or by
mutation; **suite** means a test in `npm test` that I ran and read but did not re-derive;
**author** means it needs a person with a device.

## Tally

| Result | Count | Criteria |
| --- | --- | --- |
| Passed | **70** | every criterion not listed below |
| Failed | **1** | **35** |
| Superseded | **5** | 1, 2, 4, 10, 11. Each is restated (1', 2', 4', 10', 11') and the restatement **passes** |
| Unverifiable | **1** | 48 (Messenger and Viber): `not run`, no phone |
| **Total** | **77** | |

Criterion 35 is the only one that fails. Some passing criteria have a part that needs a real
device (pinch zoom in 55, Safari focus in 57, the phone canvas limit behind 45 and 46); those
are listed under "Author-facing" and are not counted as failures or as unverifiable, because the
criterion as written is satisfied. There are also findings that are not criterion failures (a
number wrapping mid-figure, a 19 second PDF); see "Findings".

## The forced-small-limit run (priority gap 1)

The builder's claim: the adaptive pixel ratio cannot trigger on a desktop under real limits, so
it had never fired. **Half of that is wrong.**

**Forced, through the real Review panel, real rasteriser, 50 items and 10 photos (2,802 document
px tall):**

| `max_pixels` | PNG outcome | Measured |
| --- | --- | --- |
| default (16,000,000) | ratio 2, saved | 1200 x 5604, 6.7 M px, 1.08 MB, 1.0 s |
| 4,000,000 | **stepped down to 1.54, saved** | **924 x 4315**, 3.99 M px, 0.78 MB; the whole receipt (all 50 rows, all 10 photos, totals, statement, footer) |
| 2,000,000 | **refused**: "This receipt is too large to make as an image on this device. Try fewer photos, or download the PDF." | no file on disk, `save` never called, both buttons re-enabled, alert persistent |
| 1,000,000 | refused, same message | same |
| 1,000,000, no photos | refused, same message | same |

| `max_pixels` | PDF outcome | Measured |
| --- | --- | --- |
| 4,000,000 | ratio **3 -> 2.8, saved**, 5 pages | pages 1680 x 2377 |
| 1,000,000 | refused (page ratio 1.40, under the 1.5 floor), no file | |

The 4,000,000 PNG is 924 px wide, between the spec's 900 and 1200 as the plan required, and a
look at the file shows it whole and legible. Below the 1.5 floor the run **fails loudly and no
file is handed over**, in both formats.

**Under the form's real limits, with no override, the branch is reachable.** The plan estimated a
50-item receipt at 5,400 document px and concluded the branch could not fire. The table rows are
36 px, not 48, so the ordinary 50-item / 10-photo receipt is only 2,802 px. But the form permits
100-character names:

| Valid input (all under the form's limits) | Document px | Ratio chosen | PNG |
| --- | --- | --- | --- |
| 50 items, 10 photos, ordinary names | 2,802 | 2 | 1200 x 5604 |
| 50 items, 10 photos, 100-character names with spaces | 6,794 | **1.98** | 1188 x 13,452, 2.45 MB |
| 50 items, no photos, 100-character unbroken names | 7,794 | **1.84** | 1104 x 14,340, 1.97 MB |
| 50 items, 10 photos, 100-character unbroken names | 9,794 | **1.65** | 990 x 16,160, 2.13 MB |

So the adaptive step-down runs on valid, if unusual, input, with no limit forced; the 1.5 floor
needs about 11,850 document px and nothing valid reaches it (9,794 is the largest I produced).
The 990 x 16,160 PNG is 16.0 M pixels, on Safari's nominal 16.7 M ceiling; whether a real iPhone
draws it is the author's check below.

## The refusals (priority gap 3)

A real raster was made by the real rasteriser, then replaced by a bad canvas of the same size,
built exactly as the adapter builds one, and pressed through the real Review buttons:

| Injected | PNG | PDF | File on disk |
| --- | --- | --- | --- |
| Fully **transparent** canvas (paper never painted) | refused: "The file could not be created. Your receipt is safe. Try again." | refused, same | none |
| Fully **white** canvas (blank) | refused, same | refused, same | none |
| `toBlob` returns **null** | refused: "too large" message | refused, "too large" message | none |

Six runs, six refusals, `save` called zero times, zero files written. No wrong file is handed
over. The transparent case is the one a "blank" test alone would miss (transparent is not white
paper); it is refused by the margin check, and a mutation that removes it goes red.

## The timezone run (priority gap 2)

`TZ=America/Los_Angeles npm test`: **exit 0, 1013 tests in 66 files** on the suite as I found
it, and **exit 0, 1032 tests in 68 files** on the final tree ("The gate"). It is meaningful: with `long_date` rewritten to build
`new Date('2026-10-16')`, `long_date.test.ts` and `receipt_view.test.ts` go red under
`TZ=America/Los_Angeles` (7 failures) and `long_date.test.ts` goes red under `Asia/Manila` (1
failure, its own zone-setting test). Reverted. The date handling is correct in both zones and
the tests can fail.

## Pagination and the 50-item outputs (criteria 34-44)

Real PDFs from the real panel, every page opened.

| Receipt | Pages | Time | Size | Every page |
| --- | --- | --- | --- | --- |
| 50 items, 10 photos (synthetic 800 px JPEGs) | **5** | 6.2 s | 1.74 MB | 1: items 1-10; 2: 11-24; 3: 25-38; 4: 39-49; 5: item 50 with the totals, payment, notes, statement and footer. 10 thumbnails present across pages 1-4 |
| 50 items, none | **4** | 5.0 s | 1.00 MB | |
| Common receipt (2 items) | **1** | 1.3 s | 214 KB | no page label, no foot band |
| 5 items, no discount, a note | 1 | 1.4 s | | |
| 5 items, discount 20, a note | **2** | 2.4 s | 326 KB | item 5 alone with the totals on page 2 |

Every page: A4 (`MediaBox 595.28 x 841.89 pt`), all 1800 x 2547 at ratio 3, every pixel alpha
255, four corners `255,255,255,255`. Pages 2-4 have a running header (issuer, number, date, `Page
N of 5`), the table heading row, and a foot band reading the statement and `REF-... - Page N of
5`. Page 1 has the full header, and its foot band. Page 5 has the credit and `Page 5 of 5` in
the footer. No row, thumbnail or line is cut at a page boundary. Any one page alone shows the
issuer, the receipt number, the page indicator and the statement (criterion 41).

Margins and scale (criterion 43): the image is drawn at `595.2756 pt` wide, which is **210.000
mm**, so 600 px is 210 mm exactly and 40 px is 14.0 mm; it is 842.31 pt tall, 0.42 pt past the
bottom edge of the sheet, inside the white 14 mm margin. Not scaled beyond `210 mm / 600 px`.
Title `Receipt REF-20261016-154212`; no `/Author`. The PDF also carries a `CreationDate` and an
`/ID`, so two exports of one receipt differ by a few bytes of metadata; the page images are
identical (see below).

### Criterion 35 fails

The criterion: "a receipt of 1 to 5 items without photos is a single page". Measured, the
number of pages for N plain items, one-line note, GCash with a reference:

| Items | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| no discount, note | 1 | 1 | 1 | 1 | 1 | 2 | 2 | 2 |
| **discount, note** | 1 | 1 | 1 | 1 | **2** | 2 | 2 | 2 |
| no discount, no note | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
| discount, no note | 1 | 1 | 1 | 1 | 1 | 1 | 2 | 2 |

**I mark it failed, not "a typical case".** The plan expected the failure only for pathological
content (three-line names, a five-line note). It fails for ordinary content: items named
`Item 5`, a one-word note, and a discount. A discount and a note are common, and the criterion
is stated without a condition. The honest statement is that **1 to 4 items hold in every
combination I tried, and 5 hold only without a discount or without a note.** It is a layout
consequence of the redesign: the summary gained an `Amount paid` row and the payment section a
heading, so the tail is taller than the first design's. The author decides: amend the criterion
to "1 to 4 items", or tighten the layout. Note the unit test that names this criterion
(`paginate_receipt.test.ts`, "criterion 35, the typical case") uses estimated heights, so it
cannot see this; only a measured render can.

## The white background (criteria 16-22)

- **Computed-style walk (18), `.dark` on `<html>`, the real page:** 102 elements in the document
  node. Every `background-color` is transparent or `rgb(255, 255, 255)`; every `color` and every
  non-zero border colour is one of the five palette values; no `box-shadow`; no outline. Zero
  violations. The root's `color-scheme` is `light` and its `font-family` is `Geist Variable`
  first. (A concurrent change adds `caret-color`, `accent-color` and `text-decoration-color`
  resets; the walk above ran before it, and the source test covers it.)
- **Pixel comparison, harness, five receipts** (common, discount, 100-character names, Unicode,
  50 items with 10 photos), each exported in light twice and in dark once: **light versus light 0
  differing pixels; light versus dark 0 differing pixels**, all alpha 255, all four corners
  white. One earlier run showed ~114,000 differing pixels on the photo receipts; that was my
  harness drawing random noise into its fixture photos on each render, and it differed equally
  light versus light. Seeding the noise made it 0. Recorded because it is exactly the kind of
  number that gets waved through.
- **The same through the real Review buttons (22), 50 items:** PNG light versus dark **byte
  identical** (1200 x 4964, 0 non-opaque pixels, corners white). PDF light versus dark: not
  byte-identical, and the only differing bytes are `CreationDate` and `/ID` in the trailer; the
  embedded page images were compared separately (harness, common receipt) at **0 differing
  pixels**.
- The footer wordmark in the dark-mode export is the near-black one (it is in the compared
  pixels, which equal the light export).

## Criterion by criterion

`QA` checked by me in the browser or by mutation. `suite` is a test in `npm test`.

| # | Result | Evidence | Checked |
| --- | --- | --- | --- |
| 1 | Superseded | by 1' | |
| 1' | Pass | `receipt_document.test.tsx` "reads title, number, date, parties, the amount sentence, items, summary, payment, notes, statement, footer"; the rendered PNGs read in that order | QA + suite |
| 2 | Superseded | by 2' | |
| 2' | Pass | `type_scale.test.ts`: 28 / 18 / 14 / 13, "Receipt" the largest, nothing below 13; in the PNG "Receipt" and the amount sentence are the two largest | QA + suite |
| 3 | Pass | `receipt_document.test.tsx` "does not show the party type"; the view takes no party type | suite |
| 4 | Superseded | by 4' | |
| 4' | Pass | four columns in every row; rendered | QA + suite |
| 5 | Pass | discount absent at 0 and blank, present above; rendered with discount 10, 20, 50 and none | QA + suite |
| 6 | Pass | four payment cases, `receipt_document.test.tsx`; GCash with logo and reference rendered; label is "Reference number" (A7) | QA + suite |
| 7 | Pass | notes with breaks rendered (5 lines); `<script>` is literal text, no element created | QA + suite |
| 8 | Pass | 100-character item name wraps to 5 lines, 100-character issuer and recipient names to 3, 5-line note; no clipping or overlap in the PNG. **But see Finding 2** (a number wraps) | QA |
| 9 | Pass | `long_date.test.ts`; correct under `America/Los_Angeles`, mutation red | QA + suite |
| 10 | Superseded | by 10' | |
| 10' | Pass | `This is a proof of payment.` on all 5 pages of the 50-item PDF (foot band on 1-4, in flow on 5), on the one-page PDF, and in the PNG; `receipt_document.test.tsx`; mutating the text goes red | QA + suite |
| 11 | Superseded | by 11' | |
| 11' | Pass | no "Official Receipt" in any rendered document; once on Review (the notice), `receipt_wizard`/`review_step` tests; `grep -i invoice src` empty | QA + suite |
| 12 | Pass | read the rendered document: no TIN, address, registration, stamp, QR or serial field | QA |
| 13 | Pass | footer is `Generated by` and the light wordmark, no link, no timestamp, in every render. The mark is also top right (A5, flagged) | QA + suite |
| 14 | Pass | `receipt_sources.test.ts`; no `LogoWordmark`, no dark wordmark import. (`wordmark_dark.webp` is requested by the page header, not the document) | suite |
| 15 | Pass | dark and light PNGs identical | QA |
| 16 | Pass | `receipt_sources.test.ts`, root declares background, color, color-scheme, font | suite |
| 17 | Pass | `receipt_palette.test.ts`; a decoy `.dark` override is found | suite |
| 18 | Pass | walk above: 102 elements, 0 violations | QA |
| 19 | Pass | `run_export.test.ts`: the rasteriser receives `white`, not transparent or absent (keyword, plan D5); observed `background: "white"` in the real run | QA + suite |
| 20 | Pass | dark PNG: 0 non-opaque pixels, four corners `255,255,255,255` (5 receipts, plus the real-page export) | QA |
| 21 | Pass | dark PDF pages: alpha 255 on every page, corners white, equal to light | QA |
| 22 | Pass | difference count **0** on 5 receipts via the harness; **byte-identical** PNG via the real buttons | QA |
| 23 | Pass | `receipt_sources.test.ts` forbids `Intl`, `toFixed`, arithmetic in the document files; my grep of `receipt_view.ts` and the `.tsx` files is empty | QA + suite |
| 24 | Pass | `receipt_view.test.ts` on all nine fixtures, to the centavo. **Text correct; the maximum line is visually broken, Finding 2** | suite + QA |
| 25 | Pass | `receipt_view.test.ts` sums the parsed lines against the Subtotal, including 50 fractional-quantity items | suite |
| 26 | Pass | one test asserts the three totals agree | suite |
| 27 | Pass | `1.5`, `2`, `9,999.999`, never `1.500`; rendered | QA + suite |
| 28 | Pass | `₱` renders in Geist in the real PNG and the real PDF page rasters, matching the digits' weight and shape; it is in Geist's **latin-ext** file, which the browser fetched (`geist-latin-ext-wght-normal.woff2`) during export; not a fallback glyph | QA |
| 29 | Pass | `receipt_document.test.tsx`; the 50-item/10-photo receipt rows align, rows without a photo have empty space and no placeholder | QA + suite |
| 30 | Pass | thumbnail measured on the page raster: **168 px at ratio 3 = 56 CSS px**, 1 px border, 6 px radius; portrait and landscape sources both render square | QA |
| 31 | Pass | 10 of 10 thumbnails in the PNG and in the PDF (pages 1-4: 2, 3, 3, 2) | QA |
| 32 | Pass | **`object-fit: cover` works under `html2canvas-pro`**; no pre-crop needed. Portrait and landscape fixtures are cropped to square, not squashed (the corner markers in the fixtures are cut) | QA |
| 33 | Pass | `MediaBox 595.28 x 841.89 pt` (A4), portrait, 5 of 5 pages | QA |
| 34 | Pass | no control or prompt; 4 and 5 pages produced from the same click | QA |
| 35 | **FAIL** | five plain items with a discount and a one-line note take 2 pages. Table above | QA |
| 36 | Pass | `paginate_receipt.test.ts`: rows of different heights give different counts; no rows-per-page constant (`grep` empty) | suite + QA |
| 37 | Pass | `paginate_receipt.test.ts` 37a to 37g, each asserting every row once, in order, none split. In 37c-e the counts are 7, 5 and 6. Real 50-row outputs are 4 and 5 pages because real rows are 36 px, not the 48 and 72 the unit fixtures use | suite |
| 38 | Pass (amended A9) | "the last row travels with the totals"; real outputs: item 50 with the totals on page 5. The single-item case splits the tail (item and totals, then the rest) | suite + QA |
| 39 | Pass | running header on pages 2-5: issuer, number, date, `Page N of 5`; no recipient, amount or logo; `ñ`, CJK and emoji issuer render as text (harness, Unicode fixture) | QA + suite |
| 40 | Pass | `Page N of 5` correct on every page, the statement on every page, none on the one-page PDF | QA + suite |
| 41 | Pass | each of the five pages opened alone | QA |
| 42 | Pass | both 50-item PDFs, every page of the photo one opened: no row, thumbnail or line cut. **5 and 4 pages** | QA |
| 43 | Pass | 210.000 mm per 600 px, 14.0 mm margins, measured from the PDF | QA |
| 44 | Pass | 50 items, 10 photos: **5 pages, 6.2 s, 1.74 MB** (under 10 MB). The photos are synthetic 800 px noise JPEGs, so file size is indicative; the page rasters are 1800 x 2547 regardless of photo content. Real worst valid input (19 pages) is 4.9 MB, 19.0 s: Finding 3 | QA |
| 45 | Pass | 50 items, 10 photos: ratio 2, **1200 x 5604**, 6.7 M pixels. Lowered, as specified, above ~6,670 document px (Findings table) | QA |
| 46 | Pass | forced 4 M: ratio 1.54, 924 x 4315, saved. Forced 2 M and 1 M, and the PDF at 1 M: refused with the message, no file. Under real limits 1.98, 1.84, 1.65 | QA |
| 47 | Pass | one image, whole receipt, not split; 4 M PNG shows all 50 rows and the footer | QA |
| 48 | Unverifiable | Messenger and Viber were not run: no phone. Record `not run` (author-facing) | |
| 49 | Pass | `receipta-REF-20261016-154212.pdf` / `.png` on disk from real downloads; `export_filename.test.ts`: no separator or party text survives; mutating the sanitiser goes red | QA + suite |
| 50 | Pass | `grep ReviewSection\|PartyRows src` empty; Review shows the preview and no summary | QA + suite |
| 51 | Pass | one `view` built once and handed to both preview and export (`hands the export the view the preview shows`) | suite |
| 52 | Pass | Edit row and Back, data intact (`review_step.test.tsx`, and the new whole-flow test) | suite |
| 53 | Pass | the notice is above the preview | suite |
| 54 | Pass | real `/create`, 50 items, 100-character first name: `scrollWidth == clientWidth` at **320, 375, 768, 1024, 1280**; no element past the viewport; preview scale **0.367, 0.458, 1, 1, 1** | QA |
| 55 | Pass | scale 1 from 768, never above; viewport meta has no `user-scalable` or `maximum-scale` (test and `index.html`). Real pinch zoom on a phone is author-facing | QA + suite |
| 56 | Pass | both are real `<button type="button">` 44 px tall; stacked full width (246 / 301 px) at 320 and 375; side by side (192 px each) at 768, 1024, 1280. The 640 breakpoint itself is the `sm:` class, asserted by a test, not measured at 639 and 640 | QA + suite |
| 57 | Pass (Chromium) | keyboard Enter on Download image: focus stays on the running button, label `Preparing image...`, `aria-busy="true"`, the other disabled, the running one `aria-disabled`; focus on the same button after. Safari not run | QA |
| 58 | Pass | live region reads `Image created` / `PDF created`; toast asserted in `receipt_export_flow.test.tsx` and the panel test | QA + suite |
| 59 | Pass | unscaled, `aria-hidden`, inert, removed afterwards and after a throw (`run_export.test.ts`) | suite |
| 60 | Pass | a deferred decode holds the rasteriser off (`run_export.test.ts`); in the real run the latin-ext font file is requested before capture | suite + QA |
| 61 | Pass | new whole-flow test: same step, same preview text, draft values equal the entered values; mutating the export to wipe the draft goes red | QA + suite |
| 62 | Pass | `receipt_export_flow.test.tsx` and the panel test: alert, toast, buttons re-enabled, nothing saved; mutating the toast and the alert each goes red | QA + suite |
| 63 | Pass | stub, and **real** canvas with a null blob: refused, no file | QA + suite |
| 64 | Pass | stub, and **real** white canvas in the browser: refused, no file | QA + suite |
| 65 | Pass | fake timers (`run_export.test.ts`). A real 30 s was not waited out | suite |
| 66 | Pass | stub: a failed logo degrades and names it, a failed photo blocks and names the item. Not provoked with a real broken image | suite |
| 67 | Pass | alert persists until the next attempt (panel test) | suite |
| 68 | Pass | `no path ends with neither a file nor a message`, a table over every stub failure; in the browser all six refusals ended in a message and no file | QA + suite |
| 69 | Pass | both in `package.json`; imported only by `import()` in `load_ports.ts`. Entry chunk contains neither library's code: `createLinearGradient` and `Unable to find element in cloned iframe` appear in the two lazy chunks and not in the entry (its only mention is the `import()` calls and our own `addImage` call). Sizes under "The gate" | QA |
| 70 | Pass | every request during real PNG and PDF exports, light and dark, was same-origin (`localhost`), none to another host. Dev server, so modules load from `/node_modules/.vite/deps`; a production build serves them as hashed chunks | QA |
| 71 | Pass | `useCORS` and `allowTaint` appear only in a comment; no remote font, image or script in the document files | QA + suite |
| 72 | Pass | no change needed. Re-read Privacy, Cookie, Terms and `stored_items`: no new `localStorage`, `sessionStorage`, `indexedDB` or cookie in the feature (grep), the draft is untouched by export, files are made in the browser and handed to the browser's download, nothing is sent. "Nothing else is stored" and "the exported PDF or image is saved straight to your device by your browser; it does not pass through us" are both still true | QA |
| 73 | Pass | `repo_rules.test.ts` (snake_case, no `any`, no `interface`, icons, one `Intl`, no sibling imports, no colour literals) | suite |
| 74 | Pass | no `w-[`, `h-[` or `size-[` outside the document files | suite |
| 75 | Pass | form criteria 59, 61 and 62 are annotated in `2026-10-15-receipt-form/requirements.md`; the tests that asserted them are rewritten, not deleted | QA |
| 76 | Pass | roadmap line replaced; `tech-stack.md` corrected (installed, A4, 3x for PDF and 2x for PNG, hex properties) | QA |
| 77 | Pass | see "The gate" | QA |

## Findings that are not criterion failures

1. **Criterion 35**, above: the one failure.
2. **A valid maximum line breaks a number across two lines.** 999,999.99 x 9,999.999 prints
   `9,999.9` over `99` in Qty and `₱9,999,998,90` over `0.00` in Amount (the columns are 64 and
   112 px and `.receipt-num` has `overflow-wrap: anywhere`). The strings are right, so criterion
   24 passes, but a customer reads a corrupted figure. Fix options: widen Qty and Amount and
   narrow the description, or stop breaking inside numbers and let the row grow. The author's
   call; I did not change the layout.
3. **The worst valid PDF takes 19.0 s** on a fast desktop (50 items, 100-character unbroken
   names, 10 photos: 19 pages, 4.9 MB). The timeout is 30 s, so a phone that is 1.6 times slower
   will show "Making the file took too long" for input the form accepted. Not a spec failure
   (the timeout message exists for this) but worth the author's phone check.
4. **The "too large" message tells a PDF user to "download the PDF".** It is reached on the PDF
   path only by a null blob or a page ratio under the floor, neither of which valid input
   reaches on a desktop; low severity.
5. **Cosmetic:** on a PDF page that ends with a row, the row's border and the foot band's top
   border draw two hairlines about 15 px apart; the last page prints `Page N of M` twice (running
   header and footer).
6. **The accent measures 6.06:1 on white**, not about 7 as the spec's first palette said; it
   passes 4.5:1. Muted is 7.58:1.

## Author-facing, not failures

Things that need a person with a device. None was run, and none is claimed.

- **The real iPhone canvas limit.** The one check of "the failure paths match what Safari does":
  whether an over-limit canvas gives `null`, a blank image or an exception. The refusal paths
  for all three exist and were proven in Chromium with injected canvases, which is not the same
  as Safari failing. Given that the adaptive branch is reachable under real limits (990 x 16,160
  is 16.0 M pixels), this is more important than the plan assumed.
- **Messenger and Viber sending** (criterion 48): `not run`.
- **VoiceOver** over Review: not run. The roles and names are asserted in tests only.
- **The Edit row wraps at 390 px**, with "Payment" on a second line. Seen, not changed.
- Real pinch-zoom on a phone, and the busy state's focus in Safari.

## Not verified

- Anything in Safari or on a phone. Chromium only, on a dev server.
- A 30 second timeout waited out for real.
- A real broken item photo or logo (stubs only).
- The Review notice being visible "without scrolling" at 320 px (form criterion 62); it is
  above the preview, which is the strongest ordering available, but I did not scroll-measure it.
- Fonts: the system-stack fallback was not exercised (the font loaded).

## Mutation checks

Each applied, run, reverted; `git status` confirmed clean after.

| Guards | Mutation | Result |
| --- | --- | --- |
| Static-import detector | a static `import html2canvas from 'html2canvas-pro'` in `lib/`; a dynamic `import('jspdf')` in `ui/` | `repo_rules.test.ts` red both times |
| Filename | `receipta-` to `receipt-`; the sanitiser narrowed | red (whole-flow test; `export_filename.test.ts`, 2 tests) |
| `aria-busy` | removed | red |
| Success text | `PDF created` to `PDF saved` | red |
| Failure toast; failure alert | each removed | red (one test each) |
| Form untouched | export wipes `localStorage` | red |
| Nothing saved on failure | `save` called before the checks | red (both whole-flow tests) |
| Buttons re-enabled | `set_busy(null)` removed | red (both) |
| Ratio never rounds up | `floor` to `ceil` | red, 5 tests |
| 1.5 floor | floor lowered by 1 | red, 4 |
| Transparent is not white | alpha ignored | red, 2 |
| Paper margins | check removed | red, 3 |
| Statement | sentence shortened | red, 2 |
| Discount only above 0 | shown at 0 | red, 5 |
| Date | `long_date` via `new Date(iso)` | red under `America/Los_Angeles` (7) and `Asia/Manila` (1) |

## The gate

Run on the tree as it stood at the end of this task (other agents were committing and editing
the pagination, the export errors and the document CSS while I worked, so the count moved from
1013 tests in 66 files to the figure below; it includes the two new whole-flow tests).

| Command | Exit | Result |
| --- | --- | --- |
| `npm run build` | 0 | built; entry chunk `index-*.js` **772.24 kB** (749.99 kB before this feature), lazy chunks `html2canvas-pro` 280.17 kB, `jspdf` 399.68 kB, `html2canvas` 199.45 kB, `index.es` 151.41 kB, `purify` 29.02 kB. Neither library's code is in the entry chunk |
| `npm run lint` | 0 | clean |
| `npm test` (default zone, `Asia/Manila`) | 0 | **1032 tests in 68 files** |
| `TZ=America/Los_Angeles npm test` | 0 | **1032 tests in 68 files** |

Along the way `npm run build` exited 2 once, on a type error in another agent's in-flight edit to
`run_export.test.ts` (not mine); it was fixed before the final run, and the build is green
above. `vitest` does not typecheck, so the green suite alone would not have shown it.
