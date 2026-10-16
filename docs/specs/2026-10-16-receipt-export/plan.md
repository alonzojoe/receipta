# Receipt Export - Implementation Plan

Branch `feature/receipt-export`, already cut from `main`. PR targets `main`, titled
`feature/receipt-export`. Review runs automatically on open. Commits happen only after the
author has reviewed the diff.

Input: `requirements.md` (77 criteria). Nothing in it is re-opened here. Where the spec
leaves a gap, the plan names it as a decision point, recommends, and says why. Where the
spec is wrong or silent in a way that changes a test, the plan says so under "Spec gaps
found while planning" and does not quietly pick.

## Order of attack, argued

The riskiest part is rasterising: `html2canvas-pro` and `jsPDF` are not installed, nothing
in this repo has ever run them, and jsdom has no canvas (the image pipeline work proved
it). The most testable part is pagination and the view-model: pure functions of numbers
and strings. The obvious orderings are "pure first, risky last" and "risky first". Neither
is right on its own.

**Spike first (task 1), then pure logic, then the document, then the pipeline.**

- The spike is cheap (a throwaway page, no commit), it is the only thing that can
  invalidate a *design* decision (`object-fit` thumbnails, WebP logos, the peso glyph, the
  off-screen capture strategy), and every one of those lives in markup and CSS that the
  document task writes. Finding out after the document exists costs a rewrite; finding out
  first costs an afternoon. This is the same logic as task 6 of the receipt form plan, with
  one difference: that spike gated a single adapter file; this one gates the document's
  markup, so it goes before the document, not after the adapter.
- The pure tasks (view-model, pagination, ratio, blank check, error mapping) do not depend
  on the spike's outcome. If the spike kills `html2canvas-pro`, the fallback is
  `modern-screenshot` (named in `tech-stack.md`); pagination over measured heights and the
  view-model are identical under either. So they are low-regret and go second, while the
  spike's answer is still being digested. They are also where the spec's seven boundary
  cases live, so they are early as asked.
- The document comes after the spike and after the pure functions, because it consumes both
  (the spike's constraints, the view-model's strings, and the units that pagination
  measures).
- The pipeline (orchestration, measurement, download) is built against **ports** and tested
  with stubs, so almost all of it is covered without a browser. A second throwaway browser
  pass (task 8) then runs the *real* document through the *real* adapters before any Review
  UI exists, so a pipeline defect is not confused with a UI defect.
- The Review step comes last among the build tasks because it is the only part that breaks
  existing tests, and it should break them once, on a pipeline that already works.

**Dependencies are installed late on purpose.** The spike uses `npm install --no-save`, so
`package.json` and the lockfile are untouched until task 7. If the spike fails the approach,
there is nothing to revert.

## What the plan found by reading the repo

These change the shape of the work. None is in the spec.

1. **The sibling-slice rule is enforced by a test.** `repo_rules.test.ts` fails when one
   feature imports another. Criterion 73 suggests `receipt_form` importing a `receipt_export`
   feature; that would fail the suite. Decision D1 below.
2. **The money and view helpers are in the wrong layer for the document.** `item_figures`,
   `summarise_receipt`, `format_thousandths` are in
   `features/receipt_form/model/receipt_totals.ts`; `payment_method_name/icon` in
   `payment_method.ts`; `normalise_notes` in `field_rules.ts`; `cash_method`/`other_method`
   in `receipt_form_values.ts`. The document lives in `entities/receipt` (so both the form
   and the export feature can use it) and `entities` may not import `features`. They move.
   This is the same move the form plan made for `money.ts`.
3. **`find_colour_literals` forbids a hex in any `.ts`/`.tsx` string.** Criterion 19 says
   `backgroundColor: '#ffffff'` is passed to the rasteriser. A literal `#ffffff` fails the
   repo rules. Decision D5.
4. **The global base layer sets `* { border-color: var(--border); outline-color: ... }`**
   (`index.css`, `@layer base`). That token changes under `.dark`. Any bordered element in
   the document that does not set its own border colour exports with a dark-mode border.
   The spec's computed-style walk checks only `background-color` and `color`, so it would
   not catch this. The plan widens the walk.
5. **`LogoMark` is `loading="lazy"`.** A lazy image that has not been scrolled near may not
   be fetched, so "wait for every `<img>` to decode" can hang or resolve on an empty image.
   The document uses its own `<img>` elements with eager loading rather than `LogoMark`.
   (The branding constraint already forbids `LogoWordmark`.)
6. **The peso sign lives in Geist's latin-ext file.** `@fontsource-variable/geist` splits
   by `unicode-range`; U+20B1 falls in the latin-ext range (`U+20AD-20C0`), not the latin
   file that Latin text loads. A `unicode-range` entry says a file *may* hold the glyph, not
   that it does. And the browser only fetches latin-ext when a character in range is on the
   page, so `document.fonts.ready` can resolve before it arrives. The pre-capture wait must
   call `document.fonts.load()` with the text `₱` for each weight, not only wait for ready.
   (U+2212 is in the latin range, so the spec's doubt about the Unicode minus is moot, but
   the ASCII hyphen decision stands and costs nothing.)
7. **Institution icons are PNG in `public/institutions/`, not WebP.** Only the Receipta mark
   and wordmarks are WebP (`src/shared/assets/`). The spike tests both: a same-origin PNG
   from `public/` and a Vite-hashed WebP import.
8. **No CI exists** (`.github/` is absent). "Verified from the build output" and "recorded"
   mean a person ran a command. The plan says so on each.
9. **The Review step's tests assert the summary** and will break. Listed under task 9.

## Decisions

**D1. Where the document, the export, and the Review step live.**
`entities/receipt` gets a `ui` segment holding `ReceiptDocument` and its CSS, plus the new
pure model files. `features/receipt_export` holds the pipeline and the preview/buttons
panel. `features/receipt_form` may not import it.

Options for the seam: (a) a `render_review` prop on `ReceiptForm` (a render slot);
`pages/create` composes `<ReceiptForm render_review={(values) => <ReceiptExportPanel values={values} />} />`.
(b) Put the export code inside `features/receipt_form`. (c) A `widgets/receipt_builder`
that wraps both.

**Recommend (a).** Pages may compose features (the rule explicitly exempts pages), the form
stays unaware of canvases, and the export feature stays unaware of wizard steps. The slot is
a **required** prop so the Review step cannot silently render without a document. Cost: the
`render_form` test harness and `create_page.tsx` both do the composition; tested once in the
harness. (b) is boring but makes the form feature own two libraries and a 30-second timeout,
and the export would be un-importable by any later feature (Phase 3 issuer profile). (c) adds
a layer for one prop. The Edit row stays in `ReviewStep` (it owns `go_to`); the slot renders
the preview and actions.

`ReceiptExportPanel` takes a **structural** `ReceiptInput` type declared in `entities`.
`ReceiptFormValues` satisfies it with no conversion, and `entities` never imports the form's
type.

**D2. Styling the document: a plain CSS file, not Tailwind classes.**
`entities/receipt/ui/receipt_document.css`, imported by the component, using only
`var(--receipt-*)`. Reasons: (1) the fixed-pixel carve-out sits in one file instead of
leaking `w-[600px]` into TSX that `find_arbitrary_dimensions` would then need an allowlist
for; (2) unlayered author CSS beats Tailwind's `@layer base`, so the global
`* { border-color }` loses by cascade rather than by remembering to override it per element;
(3) plain declarations are what `html2canvas-pro` handles most predictably (no
`color-mix()`, no `@property`, no `@layer`-dependent resolution). The palette stays in
`index.css` `:root`, as the spec and CLAUDE.md require; the CSS file holds no colour value,
only `var()` references. Alternative: Tailwind arbitrary-value classes
(`bg-(--receipt-paper)`) with an allowlist in `repo_rules`. Rejected: more rule exceptions,
and Tailwind's output is the likeliest source of CSS the rasteriser dislikes.

**D3. PDF pages are rendered as separate page nodes, not cropped from one tall canvas.**
After pagination, each page is mounted as its own 600 x 849 node (`ReceiptPage`: running
header or full header, its rows, foot band or tail, indicator) and captured at ratio 3.
Reasons: the running header and foot band are *part of the document component* (spec), so
they must be real DOM on each page; a 1800-px-wide canvas for one page is about 4.6 million
pixels, far under any limit, whereas cropping slices out of one tall canvas holds the whole
receipt at 3x (about 29 million pixels for 5,400 document px) and would hit the very ceiling
the PNG path is careful about. Only one page canvas exists at a time; it is released
(`width = 0`) once encoded.

**D4. Off-screen mounting is imperative: `createRoot` + `flushSync` into a temporary
container.** Alternative: a state machine in the panel that renders the capture node on the
next commit. The imperative helper is a dozen lines, is directly testable in jsdom, serves
both the measurement instance and the page instances, and keeps the panel free of capture
state. Constraint it imposes: the document and page components may use no React context
(pure props to markup), which the white-background goal wants anyway. The helper returns the
node and a `dispose`, and `dispose` runs in a `finally`.

**D5. The paper colour passed to the rasteriser is the keyword `white`, not `#ffffff`.**
It is exactly `#FFFFFF`, it passes `find_colour_literals`, and the pixel test proves the
result. Alternative: allow-list the export file in `repo_rules`. Rejected: an exemption to a
rule that exists to keep colours in `index.css` is a worse trade than a keyword. Criterion
19's wording is read as "an explicit opaque white"; flagged to the author. A test asserts the
stub receives it and that it is neither `transparent` nor absent.

**D6. Real-browser verification stays manual, with a harness.** The form plan said to
revisit Vitest browser mode or Playwright if export made canvas central. It has. The case
for automating: the three layers of the white-background proof, the pixel diff and the
adapter checks would all become repeatable. The case against: a browser binary, a runner and
a CI that does not exist, for a static app with no backend, and the spec deliberately defers
"pixel-regression snapshots in CI". **Recommend manual again**, stated plainly as the reason
a rasteriser regression would not be caught by `npm test`. The author should decide whether
the third consecutive "cannot be checked in CI" feature justifies the investment; it is
listed under Deferred.

**D7. Dynamic import is in scope, not a follow-up.** The spec decides it (criterion 69) and
the cost is one seam: `lib/load_ports.ts` is the only file containing `import('html2canvas-pro')`
and `import('jspdf')`. Everything else takes the loaded ports as arguments, which is also what
makes the orchestrator stub-testable. The entry chunk is already 749.99 kB and Vite warns; a
static import would put both libraries on `/` and `/create` for a feature used at the very end
of the flow. Expected cost: a substantial addition (`html2canvas-pro` unpacks to about 5 MB and
`jspdf` to about 30 MB on disk, though most of that is not bundled; `jspdf` also pulls `fflate`
and `fast-png`) in two lazy chunks. The real figure is read from the build output in task 7 and
recorded; it is not guessed here. Prefetching the chunks on Review mount is **not** in scope
(it spends mobile data to save one first-click delay); the first click pays the download and
the "Preparing..." label covers it. Noted in Risks.

**D8. When measurement is unavailable, the export fails; there is no fallback estimate.**
See "Measured heights".

## Architecture

Feature Sliced Design v1. Imports go downward only. `repo_rules.test.ts` enforces no upward
import from `shared/` and no sibling-slice import.

```
src/
  entities/receipt/
    index.ts                       + exports below (pure model; ReceiptDocument, ReceiptPage)
    model/
      receipt_input.ts             NEW  ReceiptInput / ItemInput structural types;
                                        cash_method, other_method MOVED here
      receipt_totals.ts            MOVED from features/receipt_form/model (+ test)
      payment_method.ts            MOVED from features/receipt_form/model (+ test)
      notes.ts                     NEW  normalise_notes MOVED out of field_rules.ts
      long_date.ts                 NEW  '2026-10-16' -> '16 October 2026' from the parts
      receipt_view.ts              NEW  build_receipt_view(input) -> every displayed string
      export_filename.ts           NEW  build_export_filename(receipt_no, 'pdf' | 'png')
      type_scale.ts                NEW  the document's px sizes as constants (criterion 2)
      paginate_receipt.ts          NEW  pure: measured heights -> pages
      (each has a .test.ts beside it)
    ui/
      receipt_document.tsx         NEW  ReceiptDocument: the whole receipt, one column
      receipt_page.tsx             NEW  ReceiptPage: one paginated page of the same blocks
      receipt_blocks.tsx           NEW  header, summary, item row, totals, payment, notes,
                                        statement, footer, running header, foot band
      receipt_document.css         NEW  every fixed px size; var(--receipt-*) only
  features/receipt_export/
    index.ts                       exports ReceiptExportPanel only
    model/
      canvas_budget.ts             pure: choose_pixel_ratio
      blank_pixels.ts              pure: is_strip_blank(Uint8ClampedArray)
      export_errors.ts             pure: classify_error, message table, export_error type
      measure_layout.ts            thin DOM read -> numbers (rounds up, rejects 0/NaN)
      wait_for_assets.ts           fonts + image decode, over injected sources
      run_export.ts                orchestrator over ExportPorts; owns timeout and checks
      use_receipt_export.ts        hook: busy kind, error, announcement
      (each has a .test.ts beside it)
    lib/
      load_ports.ts                the ONLY file with import(); returns ExportPorts
      html2canvas_adapter.ts       NOT unit-testable (see seam)
      jspdf_adapter.ts             NOT unit-testable (see seam)
      mount_offscreen.ts           createRoot + flushSync + dispose; jsdom-testable
      download_blob.ts             object URL + anchor + revoke; jsdom-testable with stubs
    ui/
      receipt_export_panel.tsx     preview + status + buttons
      receipt_preview.tsx          scaling wrapper (transform), never above 100%
      export_buttons.tsx           the two buttons, busy and disabled states
  features/receipt_form/
    ui/steps/review_step.tsx       EDIT  notice + Edit row + {render_review(values)}
    ui/receipt_wizard.tsx          EDIT  required render_review prop, passed to the step
    model/receipt_totals.ts, payment_method.ts   REMOVED (moved)
    model/field_rules.ts           EDIT  imports normalise_notes from entities
  pages/create/ui/create_page.tsx  EDIT  composes ReceiptForm + ReceiptExportPanel
  index.css                        EDIT  --receipt-* in :root only
  widgets/home_steps/ui/home_steps.tsx   EDIT  "Review the summary" copy is now false
  test/receipt_form_harness.tsx    EDIT  render_form composes the same slot as create_page
docs/product/roadmap.md            EDIT  the stale "still open" line (criterion 76)
docs/product/tech-stack.md         EDIT  "Not installed yet" becomes false at task 7
package.json, package-lock.json    EDIT  html2canvas-pro, jspdf (task 7)
```

## The pure/impure seam

The line goes at **one narrow interface, `ExportPorts`**. Everything on the pure side is
ordinary TypeScript testable in jsdom. Everything on the impure side is a few lines each and
is the only code that touches a canvas or a third-party library.

```
 pure, unit-tested (entities/receipt/model, features/receipt_export/model)
 ----------------------------------------------------------------------
 build_receipt_view      ReceiptInput -> strings (money via format_centavos)
 long_date, export_filename, type_scale
 paginate_receipt        measured heights + page constraints -> pages
 choose_pixel_ratio      width, height, limits -> ratio | too_large
 is_strip_blank          RGBA bytes -> boolean
 classify_error          unknown -> one of four user messages
 measure_layout          DOM nodes -> plain numbers (stub getBoundingClientRect)
 wait_for_assets         injected font set + image list -> resolves when ready
 run_export              the orchestrator, over ExportPorts (stubs in tests)

 ExportPorts  (the seam; plain functions and one small handle type)
 ----------------------------------------------------------------------
   rasterise(node, { ratio, background }) -> RenderedCanvas
   RenderedCanvas = { width, height, to_blob(): Promise<Blob | null>,
                      read_strip(top, rows): Uint8ClampedArray, release() }
   assemble_pdf(page_images, { title }) -> Blob
   save(blob, filename)

 impure, NOT unit-testable (lib/)
 ----------------------------------------------------------------------
 html2canvas_adapter     calls html2canvas-pro, wraps the canvas as RenderedCanvas
 jspdf_adapter           new jsPDF, addImage per page, output('blob')
```

Why this shape: every behaviour the spec tests with a stub ("a stubbed rasteriser that
throws", "`toBlob` returns `null`", "a blank canvas", "30 seconds") is a behaviour of the
*orchestrator* given a misbehaving port, not of html2canvas. With `RenderedCanvas` as the
return type, a stub is five lines. The blank check does not call `getImageData` on a 13
million-pixel canvas (about 52 MB, doubling memory on a phone): it reads **strips** through
`read_strip`, and the decision lives in the pure `is_strip_blank`. The adapters contain no
decision: no ratio choice, no blank test, no filename, no error text. If a rule can be
written in one of them, it is in the wrong file. A comment in each adapter says why it has no
test (jsdom cannot rasterise), so nobody adds an empty-shell test later.

`save` (`download_blob.ts`) and `mount_offscreen.ts` are not in the untestable group: they are
`URL.createObjectURL`, an anchor click and a revoke, and `createRoot`, all stubbable in jsdom.

## Measured heights

**What is measured.** One *measurement instance* of the document is mounted off-screen at the
export width (600 px, 40 px padding, so a 520 px content column) in normal flow. Each unit
carries a `data-measure` attribute naming it: `first_head` (header, summary row, items caption
row), `continuation_head`, `foot_band`, `indicator`, one per item row (in order), and `tail`
(totals, payment, notes, statement, footer). `measure_layout` reads
`getBoundingClientRect().height` of each and rounds **up** to a whole pixel, as the spec says.

**When.** Only after the pre-capture wait (fonts via `document.fonts.load()` per weight used
with the text `₱` and a Latin sample, then `document.fonts.ready`; every `<img>` `decode()`d),
because a late font changes wrapping and a late image changes a row from 48 to 72 px.
Measuring before the wait is the bug this ordering exists to prevent. Measured on the
off-screen instance, never on the scaled preview (a transformed node reports scaled geometry).

**Heights must be additive.** Pagination sums heights, so the layout must stack the units with
no margins between them (padding and borders only; margin collapsing would break the sum).
This is a requirement on `receipt_document.css`, not on the function, and task 6 carries a
test that no measured unit sets a vertical margin.

**Measurement width equals page width.** The measurement instance and the page nodes use the
same content width and the same CSS, so a row wraps identically in both. If they differed by
a pixel of padding a three-line name could become four.

**Verify after render.** After each page node is mounted, and before it is captured, the
orchestrator checks `scrollHeight <= 849` (the page height). A page whose real content
exceeds the budget is a failure, not an export with a clipped line. This catches drift between
the measurement node and the page node, and fonts that change after the wait, at the cost of
one comparison. It is stub-testable (the page port reports a height).

**If a measurement is unavailable.** `measure_layout` returns an error for any unit that is
missing, zero, negative or not finite (jsdom returns 0 for everything, which makes this the
natural unit test). `paginate_receipt` also rejects non-positive or non-finite input as
`unmeasured`. The export then fails with the generic message ("The file could not be created.
Your receipt is safe. Try again.") and the raw cause goes to `console.error`. There is **no
fallback estimate**: a built-in 72/48 px guess is a rows-per-page constant by another name
(criterion 36 searches for it) and would silently clip a row in exactly the case it was
needed. The PNG path needs the full height, which it takes from the measurement instance's
root, so it fails the same way.

## Pagination: the pure function

`paginate_receipt` takes: the usable page height (849 - 80 = 769, a named constant derived
from page height and margin, not a literal), the measured `first_head`, `continuation_head`,
`foot_band`, `indicator`, an array of row heights, and `tail`. It returns a list of pages,
each with the indices of the rows it carries and its kind (`only`, `first`, `middle`, `last`),
or an error (`unmeasured`, `row_too_tall`, `tail_too_tall`). It knows nothing of images,
names or counts; a "row with a photo" is just a bigger number.

Rules, as the spec states them, with the parts it leaves implicit made explicit:

1. **One page if it fits:** `first_head + sum(rows) + tail <= usable`. Kind `only`; no foot
   band, no indicator (the `indicator` height is not added; a one-page PDF has none).
2. **Otherwise greedy fill of every non-last page**, with room for its head (`first_head` or
   `continuation_head`) and the `foot_band`; a row that fits exactly stays (`<=`).
3. **The last row is reserved for the final unit** (last row + `tail` + `indicator`). Fill
   greedily over all but the last row; the page left open is the final page if it can also
   hold the last row and the unit with *no* foot band; otherwise the last row and the unit
   open a new final page and the previous page keeps its foot band.
4. **No row is ever split; every row appears exactly once, in order.**
5. **Page count never feeds back into any height:** the indicator is a single line whose
   height does not depend on the digits, so the two-pass layout is stable. A test pins that.

### Spec gaps found while planning

- **Criterion 35 is not always true.** "1 to 5 items without photos is a single page" holds
  for ordinary names and notes. Five items with 100-character three-line names, a 5-line note
  and a discount is roughly 250 + 480 + 520 px, over 769, and paginates. The plan tests
  criterion 35 with ordinary content and tests the worst case separately, and tells the PM the
  criterion is a typical case, not a guarantee.
- **A one-item receipt can be two pages.** With one item, a long note and a discount,
  `first_head + row + tail` can exceed 769. Rule 3 then puts the header and summary alone on
  page 1 and the item with the totals on page 2. That is the only outcome the "last row
  travels with the totals" rule allows, but a first page with no items is odd. **Recommend
  accepting it** (the alternative strands the totals, which the spec rejected) and testing it
  as an eighth case. It needs the PM's eyes, not a silent choice.
- **Criterion 37g** ("a row taller than any possible content") is stated as "worst case is
  shorter than usable height". The test builds the worst-case row from the *limits constants*
  (maximum name length, thumbnail, wrapped-name height from the type scale), so changing a
  limit changes the test input. It cannot prove the browser renders it that short; that is
  checked on a real render in task 12.
- **Criterion 19 (`#ffffff`) and criterion 73 (feature imports feature)** conflict with
  existing repo rules. Resolved by D5 and D1.

## Tasks

Each task ends with `npm run build`, `npm run lint` and `npm test` passing before the next
begins. The verify line is what additionally proves that task.

### Task 1 - Spike: prove html2canvas-pro and jsPDF in a real browser (gate, no commit)

Human in a browser. **Throwaway and never staged.** A directory `spike/` at the repo root with
its own `index.html` and one TS module, served by `npm run dev` at `/spike/index.html`; it
imports real assets from `/src` and the real `index.css`, and edits no tracked file. Libraries
come in with `npm install --no-save html2canvas-pro jspdf`, so `package.json` and the lockfile
do not change. For the phone, `npm run dev -- --host` and the LAN address (the form was already
tested this way). `git status` shows only `spike/` and the spec folder before anything is
committed; `spike/` is deleted before task 2's commit.

The page hand-writes the document's riskiest markup, not the finished component: a 600 px white
column in Geist Variable, a thumbnail row, a payment row with a logo, a tracked uppercase
caption, a wrapping 100-character name, a `pre-wrap` note, hairline rules. It captures it with
`html2canvas-pro` and shows the canvas next to the live node.

| Check | Question | If it fails |
| --- | --- | --- |
| `object-fit: cover` | Does a 56 px square `<img>` with `object-fit: cover`, 6 px radius and a 1 px border render cropped, not squashed, for a portrait and a landscape source? | Try `background-size: cover` on a div first (cheaper than a canvas pre-crop, and it keeps the markup); else the spec's square pre-crop on a canvas. Changes thumbnail markup only. |
| WebP | Do `logo_mark.webp` and `wordmark_light.webp` (Vite-hashed imports) appear? | Add PNG copies of the two assets for the document only. Changes assets, not layout. |
| Same-origin PNG | Does `/institutions/gcash.png` from `public/` appear at 28 px? | Investigate path and origin first; if the library cannot, treat as WebP. |
| Peso glyph | Does `₱` render in Geist (not a fallback) at 400, 500, 600, 700 and bold 36 px? Compare with the live DOM, and record which font file served it. | System stack for the **whole** sheet, per spec. One CSS variable. |
| Variable weights | Do 500 and 600 differ visibly from 400 and 700 in the raster? | If weights collapse, restrict the document to the weights that work and tell the designer. |
| Text effects | `letter-spacing` with `text-transform: uppercase`, `overflow-wrap: anywhere`, `white-space: pre-wrap`, `font-variant-numeric: tabular-nums`, hairline rules at ratio 3 | Each failure names a CSS property to drop or a workaround. |
| Off-screen mount | Capture a node mounted at `left: -10000px`, versus fixed at `0,0` under content (`z-index: -1`, `pointer-events: none`). Which gives a correct, un-offset, un-blank raster? | Pick the working strategy; it is `mount_offscreen`'s CSS. |
| Dark leakage | With `.dark` on `<html>`, does anything in the raster change (border colour from the global `*` rule, outline, shadow)? | Feeds the widened computed-style walk. Fix in the CSS. |
| Scale and viewport | On a phone, does `scale: 2` give 1200 px regardless of `devicePixelRatio` (the library defaults to the device's)? Does a 390 px viewport reflow the 600 px node? | Pass `scale`, `width`, `windowWidth` explicitly. |
| Cost | Time and peak memory for 1800 x 2547 (a page at ratio 3) with 10 photos, and for 1200 x 10800. | Feeds the 30-second timeout and risk 1. |
| jsPDF | Does `addImage` of a PNG data URL, full-bleed at 210 x 297 mm, give a PDF with the right size and a white page? Output size for 7 pages of photo content. | Over 10 MB feeds risk 3 and criterion 44. |
| Canvas limit probe | On a real iPhone find the largest canvas that draws and reads back: 4096 x 4096 (16.7 M), 1200 x 10800 (13.0 M), and one above the limit. Record whether over-limit gives `null` from `toBlob`, a blank image, or an exception. | The blank check and `null` paths were designed for *a* failure mode; this learns which one is real. |
| No network | Network panel during capture: same-origin only. | Criterion 70. |

The spike tries `modern-screenshot` **only if two or more rows above fail**; trying it by
default doubles the spike.

**This task gates the rest.** If `html2canvas-pro` is abandoned, the plan changes at the
adapter only; every pure task and the orchestrator survive, which is the point of the seam. If
`object-fit` or WebP fail, tasks 6 and 7 pick up the named fix. Results (browser, version,
measured values, screenshots) are kept for the validation doc.

**Verify.** A recorded value per row. `git status` is clean of `spike/` before the next
commit. `git diff package.json` is empty.

### Task 2 - Move the shared pure pieces into `entities/receipt` (no behaviour change)

Move `receipt_totals.ts` and `payment_method.ts` (with their tests), `normalise_notes`, and
`cash_method`/`other_method` into `entities/receipt/model/`; declare `ReceiptInput` and
`ItemInput` as structural types; update every import (`receipt_form` steps, `field_rules`,
`draft_*`, `timeline_details`, fixtures). `receipt_form_values.ts` imports from `entities`.
Item `id` and `image` stay on the form's own `ItemValues`.

**Decision point: leave a re-export shim or fix the imports.** Fix the imports. A shim keeps
the old path alive and the next reader cannot tell which is canonical.

**qa-tester asserts:** the moved tests pass unchanged apart from import paths (they are the
proof nothing changed); `ReceiptFormValues` is assignable to `ReceiptInput` (a type-level
check compiled by `npm run build`; no runtime assertion is invented for it).

**Verify.** The full suite is green with no test edited except its import lines.
`grep -rn "receipt_totals\|payment_method'" src/features/receipt_form` shows only imports from
`@/entities/receipt`. `grep -rn "from '@/features" src/entities` prints nothing.

### Task 3 - View-model, date, filename, type scale (pure)

`receipt_view.ts`, `long_date.ts`, `export_filename.ts`, `type_scale.ts` and tests.

- `build_receipt_view(input)` returns every displayed string once: issuer, recipient, receipt
  number, long date, amount paid, per-item name / `qty × price` line / line amount /
  has-image, the totals rows (Subtotal and Discount only when discount is above 0), payment
  name, icon path, reference (only when present and not Cash), notes (normalised, absent when
  empty), and the fixed sentences. All money through `format_centavos` and the moved totals
  functions. **No arithmetic and no `Intl` in this file** (criterion 23). Discount prints with
  an ASCII hyphen-minus. Quantity uses `format_thousandths`.
- `long_date` builds `16 October 2026` from the three parts with a constant month table. It
  never constructs a `Date` from the ISO string. A malformed string returns the input
  unchanged rather than throwing (the form validates; the document must not crash on a stale
  draft).
- `build_export_filename(receipt_no, 'pdf' | 'png')` returns `receipta-<no>.<ext>`. It takes
  **only the receipt number**, so a party name cannot reach it by construction; it also strips
  anything outside `[A-Za-z0-9-]` and falls back to `receipta-receipt` if nothing is left, so a
  hand-edited draft cannot produce a path separator.
- `type_scale.ts` holds 24 / 36 / 20 / 18 / 15 / 13 and the page constants (600, 849, 40, 769,
  56, 28, 72). The CSS and the tests read the same numbers; task 6 asserts the CSS declares
  them.

**qa-tester asserts (criteria 1-7 content, 9, 23-27, 49):**

| Case | Assertion |
| --- | --- |
| Order | The view's fields, flattened in display order: issuer, number, date, recipient, amount, items, totals, payment, notes, statement |
| Discount 0 / blank | No Subtotal, no Discount, only Total |
| Discount 50 | Subtotal, `-₱50.00`, Total |
| The money fixtures | one item; many; fractional quantity; half-centavo; `999,999.99 x 9,999.999`; discount equals subtotal; `0.1 x 3` = `₱0.30`; `19.99 x 3` = `₱59.97`; discount `0`: exact strings to the centavo |
| Sum of lines | Parse each displayed line amount back from the strings; the sum equals the displayed Subtotal, for every fixture and for 50 items with fractional quantities |
| Three agree | The view's Total, the summary-row amount and the form's `summarise_receipt` Total are the same for the same values (criterion 26) |
| Quantity | `1.5`, `2`, `9,999.999`; never `1.500` |
| Date | `2026-10-16` -> `16 October 2026`; `2026-01-05` -> `5 January 2026`; leap day; the same under `TZ=America/Los_Angeles` and `Asia/Manila` |
| Party type | Individual and Organization give a deep-equal view for the same names |
| Payment | institution (name and icon path from `institutions`), Cash (no icon, no reference even if one is stored), Other (text, no icon), reference only when present |
| Notes | `<script>` stays literal text in the view; empty notes absent (not an empty string) |
| Statement | The view carries exactly `This is a proof of payment, not a BIR Official Receipt.`; no input can remove it |
| Filename | `receipta-REF-20261016-154212.pdf` and `.png`; a receipt no. of `../x/ñ` yields no separator; empty yields the fallback; a signature that took a party name would not compile |
| Forbidden words | The view's strings contain none of `Invoice`, `OR No.`, `Serial`, `TIN`, `VAT`, `Paid` as a stamp |

**Verify.** `npm test -- entities/receipt`. Mutate `build_receipt_view` to show the Discount
row at 0: the criterion 5 test fails; revert. `grep -nE "Intl|toFixed|parseFloat|Number\("
src/entities/receipt/model/receipt_view.ts` prints nothing.

### Task 4 - Pagination (pure): the seven boundary cases and more

`paginate_receipt.ts` and its test. Built entirely from numbers. Fixtures use named constants
for the 72 px and 48 px rows and a three-line-name row built from the type scale, never a
literal in an assertion.

Every case asserts three invariants through one shared helper: **each row index appears
exactly once, in order; no page's content exceeds its budget; the last row is on the same page
as the tail** (criterion 38).

**qa-tester asserts:**

| Case | Setup | Assertion |
| --- | --- | --- |
| 37a exact | Heights chosen so page 1 content equals the budget to the pixel | The last row that fits stays (`<=`); no spurious empty successor page |
| 37a, 1 px over | Same, one row 1 px taller | That row moves; proves `<` was not used |
| 37b one more | One row more than fits | That row, and only that row, is on the next page, whole |
| 37c | 50 rows of 72 | Count recorded; every row once |
| 37d | 50 rows of 48 | Count recorded; fewer pages than c |
| 37e | Alternating 72 / 48 | Page count differs from both c and d (criterion 36) |
| 37f first | A three-line-name row first | Not split; placed first on page 1 |
| 37f last | Same, last | Travels with the tail |
| 37f boundary | Same, sized to land exactly on the limit | Obeys `<=` |
| 37g | Worst-case row built from the limits constants | Strictly less than `usable`; an absurd row returns `row_too_tall`, never a crash |
| 38, items end on the limit | Rows fill page 1 exactly | The last row moves to the final page with the tail |
| Tail alone | Rows leave exactly no room for the tail | Never a page with the tail and no row |
| One page | `first_head + rows + tail` fits | Kind `only`, one page, no indicator, no foot band |
| Single item, two pages | One row plus the largest tail | Page 1 head only, page 2 row and tail (the spec gap above), asserted so changing it is deliberate |
| Foot band | Multi-page | Every non-last page reserves `foot_band`; the last does not |
| Rows-per-page | Same row count, different heights | Different page counts; a source search of the file finds no rows-per-page constant (criterion 36) |
| Bad input | 0, negative, `NaN`, `Infinity`, empty rows | `unmeasured` or a defined error; never a thrown exception, never a page |

**Verify.** `npm test -- paginate_receipt`. Mutate `<=` to `<`: 37a and the 1-px case must
fail; revert. Remove the "reserve the last row" step: 38 must fail; revert.
`grep -nE "rows_per_page|per_page" src/entities` prints nothing.

### Task 5 - Export policy: ratio, blank check, errors (pure)

`canvas_budget.ts`, `blank_pixels.ts`, `export_errors.ts` and tests.

- `choose_pixel_ratio({ width: 600, height, preferred: 2, floor: 1.5, max_pixels })` returns
  the ratio or `too_large`. If `600 * height * preferred^2 <= max_pixels`, that ratio.
  Otherwise the largest ratio rounded **down** to two decimals whose area fits; under the floor,
  `too_large`. `max_pixels` is a parameter defaulting to `16_000_000` (criterion 45), held in
  one constant so task 12 can override it. PDF pages use the same function with
  `preferred: 3` (a page is about 4.6 M pixels).
- `is_strip_blank(rgba)` is true only when every pixel is opaque white. The orchestrator calls
  it per strip and stops at the first non-white pixel, so a normal receipt exits after a few
  strips.
- `export_errors.ts`: a typed `ExportError` (`photo_unreadable` with the item number,
  `too_large`, `timed_out`, `blank`, `unmeasured`, `unknown`), `classify_error(unknown)`, and
  the four user messages from the spec, byte for byte. A thrown allocation error and a `null`
  blob both classify as `too_large`. The raw error is kept for `console.error`.

**Where the adaptive branch is actually reachable.** Under the form's limits the worst receipt
is about 5,400 to 5,700 document px, so 13.0 to 13.7 M pixels at 2x. The ratio only drops
below 2 above about 6,670 document px and fails below 1.5x above about 11,850. So the adaptive
branch is **a guard that today's limits cannot reach on a desktop**, and the plan does not
pretend otherwise. It matters because a phone's practical ceiling is below the nominal one
(task 12), and because a future limit change should not become a silent failure. Unit tests
prove the arithmetic; the wiring is proven by a forced-small-limit run.

**qa-tester asserts (criteria 45, 46, 63, 64):**

| Case | Assertion |
| --- | --- |
| Worst case (10,800 px tall at 2x, 12.96 M) | ratio exactly 2 |
| One document pixel past the 2x limit | a ratio under 2 with area `<= max_pixels` |
| Never rounds up | across a sweep of heights, `area(ratio) <= max_pixels` always |
| Between floor and preferred | an input needing about 1.6 returns that |
| Below 1.5 | `too_large`; the same input with a larger `max_pixels` succeeds |
| Width follows the ratio | `600 * ratio` is the PNG width (1200 at 2) |
| Strip blank / not | all-white strip true; one pixel at 254 false; alpha-0 white false (transparent is not white paper); empty array handled |
| Error map | `null` blob -> `too_large`; allocation `RangeError` -> `too_large`; a photo error -> message with the item number; anything else -> generic; each message equals the spec string exactly |
| Wording | No message contains `Invoice` or `Official Receipt` |

**Verify.** `npm test -- canvas_budget blank_pixels export_errors`.

### Task 6 - Palette, document and page components, white-background source tests

`--receipt-*` in `index.css` `:root`; `receipt_document.css`; `receipt_document.tsx`,
`receipt_page.tsx`, `receipt_blocks.tsx`; their tests; the source tests.

- **Palette** in `:root` only, as the spec lists (paper, ink, muted, rule, accent) plus
  whatever the spike showed is needed (for example a thumbnail border). Never in `.dark`.
- **The CSS file** declares every fixed pixel size from `type_scale.ts`; the document root's
  own `background`, `color`, `color-scheme: light` and `font-family`; an explicit
  `border-color` on every bordered rule; `outline` and `box-shadow` none at the root; and the
  thumbnail construction the spike chose. No vertical margins between measured units (additive
  heights). Text wraps with `overflow-wrap: anywhere`.
- **Components** take the `ReceiptView` (not the form values) and lay out text. The footer
  renders from the two image imports directly (`logo_mark.webp`, `wordmark_light.webp`), eager
  loading. They import no `LogoMark`, no `LogoWordmark`, no theme hook, no `react-icons`, no
  context. `ReceiptDocument` is the continuous document (preview and measurement instance).
  `ReceiptPage` renders one paginated page from the same block components: one markup for
  blocks, two compositions. The `data-measure` attributes live on the block wrappers.
- **Fonts.** The CSS stack is `'Geist Variable'` then a system sans-serif list containing the
  peso sign, per the spec. If the spike showed `₱` missing, the stack is system-first for the
  whole document.

**Decision point: how the white-background source test finds "theme token classes".**
Hard-coding five names will miss the sixth. **Recommend deriving the list from `index.css`**:
read its `--color-*` entries (the tokens Tailwind turns into `bg-*`, `text-*`, `border-*`,
`ring-*`, `fill-*` utilities) and forbid any utility using one of those names in the document
files, plus `dark:`, `currentColor`/`currentcolor`, `inherit` for colour, with the spec's
literal list as a floor. A new token then covers itself. Cost: a small parser in a test, proven
with fixture strings as the `source_rules.ts` detectors are.

**qa-tester asserts (criteria 1-8 structure, 10, 13-17, 23, 29, 39):**

| Layer / area | Assertion |
| --- | --- |
| Source, layer 1 | Over `entities/receipt/ui/*` (tsx and css), non-test: no `dark:`, no theme-token utility, no `currentColor`, no hex literal (colour is `var(--receipt-*)` only), no `LogoWordmark`, no import of `wordmark_dark`, no `Intl`, no `toFixed`. The detector is proven both ways on fixtures: fires on `dark:bg-black`, `bg-card`, `text-muted-foreground`; silent on prose |
| Root declares itself | The `.receipt-document` rule contains `background`, `color`, `color-scheme: light` and `font-family` |
| Criterion 17 | A test parses `index.css`: every `--receipt-*` is inside `:root`, none inside any `.dark` block; the block extractor is tested on a fixture with a decoy `.dark` |
| Palette contrast | Muted and accent on paper compute at the ratios the spec claims (a pure function over the hexes read from `index.css`) |
| Order | Rendering `ReceiptDocument` from a fixed view, text order is issuer, number, date, recipient, amount, items, totals, payment, notes, statement, footer |
| Type scale | The issuer size is the largest in `type_scale.ts` and the amount the largest number (criterion 2); the CSS declares each constant |
| Statement | Always present in `ReceiptDocument`; no prop removes it; each `ReceiptPage` of a 3-page plan carries it (foot band, or in-flow on the last) |
| Page model | `Page 1 of 3` spelled out on each page of a 3-page plan; none on a one-page plan; only the last page has the footer credit |
| Running header | Issuer, number, date, `Page N of M`; no recipient, no amount, no logo image; `ñ` and CJK issuer names render as text |
| Images | None: no thumbnail column. Some: every row reserves the column, and rows without an image have no `<img>` and no placeholder element |
| Notes | `<script>` appears as literal text and `container.querySelector('script')` is null; empty notes: no caption, no wrapper |
| Footer | `Generated by`, both images present with `src` from the two assets, no `<a>`, no timestamp-shaped text |
| Wording | No heading or label contains "Official Receipt" (it is a `<p>`); no whole-word `Invoice`, `OR No.`, `Serial`, `TIN`, `VAT` |
| Additive heights | No rule for a `data-measure` unit sets a vertical margin |
| Reproducible | Rendering the same view twice gives identical markup |

**Not testable here, browser:** that 100 characters wrap without clipping, that the thumbnail
is 56 px and cropped, that the glyph is Geist, that anything is white. Tasks 8 and 12 record
these. The tests above do not claim them.

**Verify.** Build, lint, test. Mutate: add `dark:bg-black` to a block, then `bg-card`, then
import `LogoWordmark`: each must fail the source test; revert. Delete the `.receipt-document`
`color-scheme` declaration: the root test fails; revert.

### Task 7 - Dependencies, adapters, orchestrator, download (the pipeline, stub-tested)

`npm install html2canvas-pro jspdf` (now into `package.json`). `lib/load_ports.ts`,
`html2canvas_adapter.ts`, `jspdf_adapter.ts`, `mount_offscreen.ts`, `download_blob.ts`, and in
`model/`: `measure_layout.ts`, `wait_for_assets.ts`, `run_export.ts`, `use_receipt_export.ts`,
with tests for everything but the two adapters.

- `run_export(kind, input, ports, options)` does, in order: mount the measurement instance,
  wait for assets, measure. **PNG:** choose the ratio, rasterise the whole document, check
  `to_blob` is non-null and non-empty, run the strip blank check, save. **PDF:** paginate; for
  each page mount the page node, wait, verify `scrollHeight`, rasterise at 3, check non-blank,
  collect the image, release the canvas and dispose the node; then assemble and save. It never
  calls `save` unless every check passed (**never hand over a wrong file**). Disposal and
  canvas release run in `finally`. The measurement instance is disposed before the large canvas
  is allocated.
- **The 30-second timeout** wraps the whole run. The library cannot be cancelled, so on timeout
  the result is ignored, the nodes are disposed, and nothing is saved even if the library later
  resolves.
- **Wait for assets**: `document.fonts.load` per weight with `₱` and a Latin sample, then
  `fonts.ready`; every `<img>` in the instance `decode()`d. A rejected decode of an **item**
  image is `photo_unreadable` naming its item number. A rejected decode of an institution or
  Receipta logo is a warning (the name carries on) and the success text adds `The {name} logo
  could not be loaded.`. A font that fails to load proceeds (the CSS stack falls back).
- **`html2canvas` options**, set in the adapter and nowhere else: `scale` (explicit, never the
  device default), `backgroundColor` (`white`, D5), `width`, `windowWidth`, `useCORS` and
  `allowTaint` **unset** (criterion 71), and the mount strategy the spike chose.
- **`use_receipt_export`** keeps `busy: 'pdf' | 'image' | null`, `error`, `announcement`; one
  export at a time; it never writes form state.
- **Dynamic import.** `load_ports.ts` holds the only `import()` calls; the hook calls it on the
  first click and caches the promise.

**Decision point: the success announcement.** The live-region text equals the toast text
(`PDF created`, `Image created`), with the logo warning appended when there is one. One string
to both, so they cannot disagree.

**qa-tester asserts (criteria 19, 33-34 structure, 49, 59-68), every one a stubbed-port test
named by the user-visible outcome:**

| Outcome | Stub | Assertion |
| --- | --- | --- |
| Capture is unscaled and hidden | real `mount_offscreen` in jsdom | The captured node and its ancestors have no `transform`, `aria-hidden="true"` and `inert`; it is removed after, and also after a throw |
| Waits before capturing | An image whose `decode()` is a deferred promise | `rasterise` is not called until it resolves; likewise a deferred `fonts.load` |
| Item photo failure blocks | `decode` rejects for item 3 | No file; "The photo for item 3 could not be read. Remove it and attach it again, then try again." |
| Logo failure degrades | `decode` rejects for a logo | The file is saved; the announcement names the logo |
| Rasteriser throws | `rasterise` throws | Inline `role="alert"` text and a toast; both buttons re-enabled; `save` never called |
| Blob is null | `to_blob` -> `null` | The "too large" message; `save` never called |
| Blank canvas | `read_strip` returns all white | Rejected; `save` never called |
| Timeout | `rasterise` never resolves; fake timers +30 s | The timeout message; nodes disposed; a late resolve does not save |
| Ratio wiring | `max_pixels` forced small | The ratio passed to `rasterise` is the lowered one; below the floor the run fails with the too-large message and no file |
| Paper | | `rasterise` receives `white`, not transparent |
| Unmeasured | `measure_layout` stub returns 0 | Generic message; no pagination attempted; no file |
| Page overflows | page `scrollHeight` over budget | Generic message; no file |
| PDF assembly | 3-page plan | `assemble_pdf` receives 3 images in order, title `Receipt REF-...`, no author, no party names |
| Filename | | `save` receives `receipta-REF-....pdf` / `.png` |
| One export at a time | start a second while busy | Ignored |
| Error persists | fail, then re-render | The error stays until the next attempt starts, then clears |
| Silent path | a table over every stub failure above | Each ends with a `save` call or an error; none ends with neither (criterion 68) |
| No form change | | Values, draft, receipt number and step deep-equal before and after (criterion 61) |
| Dynamic import | | A source check finds no static import of either library anywhere in `src` |
| `download_blob` | `URL.createObjectURL` / `revokeObjectURL` stubbed | The anchor `download` equals the filename; the URL is revoked after the click |

**Verify.** Build, lint, test. Then read the build output: the **entry chunk (`index-*.js`)
contains neither `html2canvas` nor `jspdf`** (`grep -l` over `dist/assets`), two new lazy chunks
exist, and their sizes are recorded beside the entry chunk's before (749.99 kB) and after. The
entry chunk growing by more than the new `entities` and `features/receipt_export` code means a
static import slipped in. `dist` is git-ignored.

### Task 8 - Prove the real pipeline in a real browser, before any UI (gate, no commit)

Human in a browser. Another throwaway under `spike/` (recreated, deleted afterwards): it
renders the real `ReceiptDocument` from fixtures and calls the real `run_export` with the real
adapters, with the "page images" port swapped for one that also keeps the page PNGs so they can
be compared.

Fixtures: the common receipt; 50 items without photos; 50 items with 10 photos (portrait and
landscape); the 100-character name, 100-character party names and 5-line note; a Unicode issuer
name; the discount cases.

| Check | Pass condition |
| --- | --- |
| Task 1 conclusions hold on the real component | The `object-fit` / WebP / peso decisions produce the real output they predicted |
| 56 px cover thumbnails, 28 px logo, hairlines | Measured on the PNG, not assumed |
| Heights agree | For each fixture the sum of measured units matches the rendered page content height within 1 px; no page fails the `scrollHeight` check |
| Pagination on real output | 50 items without photos and 50 with 10 photos: every page opened and looked at; no row, thumbnail or line cut; counts recorded (the spec expects about 4 and about 6 to 7; these are estimates, recorded not asserted) |
| Statement and footer | On the right pages |
| Computed-style walk | With `.dark` on `<html>`, over every element of an unscaled instance: `background-color` transparent or `rgb(255,255,255)`; `color` in the palette; **also** every border colour, outline colour and `box-shadow` (the widening from finding 4) |
| Light-versus-dark PNG | The same draft exported light and dark: the two files decode to identical pixels (difference count 0), every alpha 255, four corners white. The comparison is a small local page that loads the two downloaded PNGs into canvases and compares `getImageData`; run on the **downloaded files**, so it tests the real output |
| Reproducible | Exporting the same draft twice in the same theme gives zero difference. This is why the footer has no timestamp. If it is not zero, something else is non-deterministic and must be found before the light-versus-dark result means anything |
| PDF | Page size A4 (read from the file), margins 14 mm, page count; the dark-mode page PNGs compared as above, and the PDF itself looked at |
| Time and size | Worst case 50 items / 10 photos: generation time, PDF size (criterion 44, under 10 MB), PNG size |
| No network | Same-origin only |

**What a human has to look at, and what a number cannot say:** whether the glyph is the right
glyph, whether a photo is cropped sensibly, whether text is crisp. Screenshots are kept.

**Verify.** A recorded value per row; any non-zero pixel difference is investigated, not waved
through. `git status` is clean of `spike/`; `git diff package.json` shows only task 7's change.

### Task 9 - The Review step: preview, actions, and the tests it breaks

`receipt_preview.tsx`, `export_buttons.tsx`, `receipt_export_panel.tsx`; edits to
`review_step.tsx`, `receipt_wizard.tsx`, `create_page.tsx`, the harness; the old summary
removed (its sections, `Row`, `PartyRows`, `ReviewSection`); `home_steps.tsx` copy.

- **Review step** keeps the notice ("This is a receipt, not a BIR Official Receipt.",
  unchanged) above the preview, a single Edit row (`Edit parties`, `Edit items`, `Edit payment`,
  as buttons calling `go_to`, because steps are not routed), and `render_review(values)`.
  **Keep the accessible names `Edit payment` etc.** so the existing `payment_step.test.tsx`
  click keeps working.
- **Preview scaling.** A fluid container; a `ResizeObserver` gives its width; scale is
  `min(1, width / 600)`. A CSS `transform: scale(n)` with `transform-origin: top left` does not
  shrink the layout box, so the wrapper's height must be `document height * scale` or a blank
  gap follows. Set both as unitless custom properties (`--scale`, `--doc-height`) and compute
  the height in CSS with `calc`, so no inline pixel width or height appears (`find_fixed_pixel_styles`
  would flag one). The document's own height comes from a second `ResizeObserver`. The scale
  never exceeds 1; the viewport meta is already `initial-scale=1.0` with no `user-scalable=no`,
  and a test pins that.
- **Buttons.** Real `<button type="button">` (Review sits inside the wizard's `<form>`; a
  default `type="submit"` would trigger Next), `min-h-11`, side by side from `sm` (640 px),
  stacked full width below. Busy: both disabled, the running one labelled `Preparing PDF...` /
  `Preparing image...` with `aria-busy`, focus staying on it. Disabling a focused button can
  drop focus in some browsers; if a test or the Safari check shows it does, the running button
  uses `aria-disabled` with its click ignored instead. Decided by test, not by guess.
- **Feedback.** `toast.success` from `react-hot-toast` (the single `Toaster` is in
  `root_layout.tsx`) and a polite `role="status"` live region with the same text. Failure is a
  persistent `role="alert"` beside the buttons plus a toast.

**Tests that break, and what happens to each.** This is the equivalent of `router.test.tsx` in
the form plan.

| Test | Breaks because | Work |
| --- | --- | --- |
| `steps/review_step.test.tsx`: `shows every field, formatted` | Asserts summary labels ("Receipt date", "Type", "Method") | Rewrite against the document: the same data, formatted for sending (`16 October 2026`, no "Type") |
| same: `shows the receipt number as text, not as an input` | Summary-specific | Rewrite: the number is text in the document; still no input |
| same: `Discount only when above 0`, `omits the Reference No. for Cash`, `renders HTML in Notes as literal text`, `no Notes heading ... when Notes is empty` | Same assertions, different DOM | Rewrite against the document. The content assertions now live in the task 3 and 6 tests; keep one integration pass here so the wired preview is checked, not duplicated |
| same: `has an Edit button per section ...` | Per-section buttons removed | Rewrite for the single Edit row; names preserved; still asserts data intact on return |
| same: `has no export, download or print control` | Now false by design | **Invert**: Download PDF and Download image exist and are buttons; the old assertion survives for steps 1 to 3 |
| same: `puts the BIR notice directly after the totals` | The notice moves above the preview | Rewrite: the notice precedes the preview; the document carries its own statement after the payment |
| same: `the BIR line` / `says "Official Receipt" exactly once across every step` | Review now contains two: the notice and the document statement | Change to exactly 0 on steps 1 to 3 and exactly 2 on Review, with the reason in the test; the forbidden-word patterns stay at zero |
| same: `never puts it in a label, heading or test id` | Must hold with the document present | Keep; it now also guards the document and the preview region's `aria-label` |
| `receipt_wizard.test.tsx` line 33: `has no export, download or print control anywhere in the flow` | Review now has them | Rewrite as "only on Review" (steps 1 to 3 none; step 4 two) |
| `receipt_wizard_keyboard.test.tsx` around line 62 | Asserts `body.textContent` contains `2026-10-01` | The document prints `1 October 2026`; update. `Juan Dela Cruz`, `Printing`, `₱1,520.00`, `Maya`, `Thank you` still appear. Add the two download buttons to the keyboard path (reachable by Tab, activated by Enter) |
| `receipt_wizard_back.test.tsx` lines 96 to 117 | Compares the form's `textContent` before and after, and finds `img[src=photo]` | Holds only if the document is deterministic and renders item images as `<img src={data URL}>`. Keep as a regression guard and confirm it passes unchanged. If the preview mounts asynchronously it flakes, which is a defect in the preview, not a reason to edit the test |
| `receipt_wizard.test.tsx` lines 312 to 335 (`the whole flow`) | Same `textContent` equality | Same as above |
| `steps/payment_step.test.tsx` line 103 | Clicks `Edit payment` | Passes if the accessible name is kept; verified, not assumed |
| `receipt_wizard_draft.test.tsx` (clear draft from step 4) | Renders Review with the document | Expected to pass; the document must render with default values, fixture values and no images without throwing in jsdom (the preview calls no `decode()`) |
| `src/test/receipt_form_harness.tsx` | `render_form` renders `<ReceiptForm />` with no slot, now a type error | Compose the same slot as `create_page.tsx`, so every wizard test sees the real Review |
| `widgets/home_steps/ui/home_steps.tsx` copy | "Review the summary" is no longer what the step is | Edit to say it is a preview of the receipt. No test pins the old text (searched) |

New tests: the scale is `1` at 768 and above and below 1 under 600 (stub the observer's width);
the wrapper height equals `doc * scale`; busy label, `aria-busy`, both disabled, focus retained;
success shows the toast and the live-region text; failure shows a `role="alert"` that persists;
Back remains; `render_review` is required (type-level, checked by the build); the preview is
the same component and view-model as the export input (criterion 51: one test builds the view
once and renders both from it).

**Verify.** Build, lint, test. `grep -rn "ReviewSection\|PartyRows" src` prints nothing (the
summary is removed, not left unused, criterion 50). `grep -rniE "\binvoice\b" src` prints
nothing. Manual in `npm run dev`: walk to Review, the preview shows, Edit parties returns with
data intact.

### Task 10 - Repository rules and the stale documents

- `repo_rules.test.ts` and `source_rules.ts`: add a detector for a **static import of
  `html2canvas-pro` or `jspdf`** anywhere but `load_ports.ts`, proven both ways in
  `source_rules.test.ts`. Confirm the new files pass the existing rules (snake_case, no `any`,
  no `interface`, icons, one `Intl.NumberFormat`, no sibling imports, no colour literals, no
  `w-[`). The document's fixed pixel sizes are in the CSS file, so no allowlist is added.
- `docs/product/roadmap.md`: replace "Export library chosen and justified - still open" with the
  decided state (criterion 76). Correct `tech-stack.md`'s "Not installed yet".
- Privacy and Cookie pages and `stored_items` (criterion 72): re-read each and record "no change
  needed" or the fix. Export stores nothing and sends nothing, so none is expected to change,
  but the promise is read by a person, not asserted.

**Verify.** Build, lint, test. The document edits are visible in `git diff`.

### Task 11 - Whole-flow tests and a final repository pass

One test walks the wizard to Review and drives both downloads with stub ports through the real
panel: busy label, then `save` receives the right filename, then the success text, then the form
values are untouched. One test forces a failing port and asserts the alert, the toast, and that
Back and the Edit row still work. Re-run the whole suite under `TZ=America/Los_Angeles`.

**Verify.** `npm run build`, `npm run lint`, `npm test` all exit 0 (criterion 77), and
`TZ=America/Los_Angeles npm test` is green.

### Task 12 - Verify in a real browser and on a phone, and record

All of this needs a human. None of it can be checked in jsdom, and the plan does not pretend
otherwise. `qa-tester` produces the validation doc; this plan does not. **Every criterion the
spec marks "recorded" is empty today**, so this task is where they get a value.

| Criterion | What to do |
| --- | --- |
| 8, 30, 31 | At the export size: 100-character name, party name and 5-line note, and 10 photos (portrait and landscape), in the PDF and the PNG; no clipping or overlap; thumbnail 56 px with a 1 px border |
| 18, 20-22 | The light/dark walk and pixel diff of task 8, repeated through the real Review buttons on the finished build |
| 28 | The peso sign in a real PDF and a real PNG, same font as the digits, looked at; the serving font file recorded |
| 32 | Which of `object-fit`, `background-size`, or canvas pre-crop was used |
| 33, 43 | Page size and margins read from the PDF file |
| 40-42, 44 | Every page of both 50-item outputs opened alone: issuer, number, indicator and statement on each; page counts; time; size under 10 MB |
| 45-47, **forced-limit run** | On desktop, temporarily set the `max_pixels` constant small (for example 4 M, then 1 M) in an uncommitted edit and export the 50-item receipt. At 4 M the PNG is narrower than 1200 and at least 900 px, and is the whole receipt; at 1 M the run fails with the "too large" message, saves no file and leaves the form intact. Revert; `git diff` clean. This proves the ratio reaches the pixels, which a calculation cannot |
| 45-46, **real phone** | On a real iPhone (and a mid-range Android if available), export the 50-item, 10-photo receipt as an image. Record: success, ratio, pixel size, time, whether the tab was killed. Then temporarily raise `max_pixels` past the device's limit (uncommitted) to **provoke the real failure** and record whether it is a `null` blob, a blank canvas or an exception, that the app shows the "too large" message and saves nothing. This is the only check of the claim "the failure paths match what Safari does" |
| 48 | Send a real export through Messenger and Viber; record the device, whether amount, names and statement read at full screen without zoom, and what the apps did to the image. If not done, record `not run` |
| 54 | `scrollWidth <= clientWidth` at 320, 768 and 1280 on Review with 50 items and a 100-character name; the scale at each |
| 55 | The preview is 100% from 768; pinch-zoom works on the phone |
| 56-57 | Buttons 44 px or more, side by side from 640, stacked below; the busy state keeps focus in Safari and Chrome |
| 70 | Network panel during a real export: same-origin only |
| screen reader | One VoiceOver pass over Review: the preview region's name, the two buttons, the live region |

**Verify.** Each row has a recorded value, not a tick. `git status` is clean of any
uncommitted limit edit.

## Commit grouping

| Commit | Covers |
| --- | --- |
| `docs: add receipt export spec and plan` | `requirements.md`, `plan.md` |
| `refactor: move receipt totals and payment helpers into the receipt entity` | task 2 (task 1 produces no commit) |
| `feat: add receipt view model, long date and export filename` | task 3 |
| `feat: paginate the receipt from measured heights` | task 4 |
| `feat: add canvas budget, blank check and export errors` | task 5 |
| `feat: add the receipt document and its white-paper palette` | task 6 |
| `feat: add receipt export pipeline for pdf and png` | task 7 (task 8 produces no commit) |
| `feat: preview and download the receipt on the review step` | task 9 |
| `chore: pin export import rules and correct stale docs` | task 10 |
| `test: cover the receipt export end to end` | task 11 |
| `docs: record receipt export validation` | task 12, written by `qa-tester` |

Grouping notes. Task 2 is its own `refactor:` because it changes no behaviour and is reviewable
as "the tests are unchanged". Tasks 3, 4 and 5 are separate commits because each is a
self-contained pure module a reviewer can read without a browser. Task 6 is one commit because
the palette, CSS and components are not useful alone and the source tests are the contract for
all three. Task 7 holds the `package.json` change with the code that uses it, so no commit
installs an unused dependency. Task 9 is one commit because the old summary's removal, the new
panel and the rewritten tests only make sense together; removing the summary without the
preview, or the reverse, leaves the suite red.

## Criteria coverage

| Criteria | Task |
| --- | --- |
| 1-7 (content), 9, 23-27, 49 | 3, 6 |
| 2, 13-17, 29 (structure) | 6 |
| 8, 28, 30-32 | 1, 8, 12 |
| 10, 11, 12 | 3, 6, 9 |
| 18, 20-22 | 8, 12 |
| 19 | 7 |
| 33-34, 43 | 7, 12 |
| 35-38 | 4 |
| 39-41 | 6, 12 |
| 42, 44 | 8, 12 |
| 45-47 | 5, 7, 12 |
| 48 | 12 |
| 50-53, 56-58 | 9 |
| 54-55 | 9, 12 |
| 59-68 | 7, 11 |
| 69 | 7 (build output) |
| 70 | 8, 12 |
| 71 | 7, 10 |
| 72 | 10 |
| 73-74 | 2, 6, 10 (D1, D2) |
| 75 | 9 |
| 76 | 10 |
| 77 | every task; 11 |

## Risks

**1. Rasterising the worst case on a phone is the biggest risk, and nothing in `npm test`
touches it.** The worst case is about 13 million pixels against Safari's nominal 16.7 million,
and the nominal limit is not the practical one: memory, not area, often fails first on a
low-end phone, and `toBlob` encodes a second copy of the canvas. Safari's over-limit failure
may be a blank canvas rather than a `null` blob, which is why the blank strip check exists as a
second line and why task 12 provokes the real failure on a real device instead of trusting the
calculation. The adaptive ratio is unreachable on a desktop under today's limits, so a desktop
run proves only that it is wired, which the forced-limit run covers. If a real phone fails
below 2x, the options are lowering the preferred ratio, lowering the item limit, or steering
the user to the PDF. All three are product decisions, not implementer ones.

**2. `html2canvas-pro` supports a narrower CSS than the document needs.** It re-implements
painting; it does not use the browser's renderer. Variable-font weights, `letter-spacing` with
`text-transform`, `object-fit`, `overflow-wrap: anywhere`, hairline borders at ratio 3 and
rounded clipping of an image are each a place it can differ from the preview, and the preview
is what the user trusts. Task 1 tests the ones the spec names plus the ones this plan added,
but a CSS property added later is a new risk with no test to catch it. The fallback is
`modern-screenshot`, which fails differently (SVG `foreignObject`, fonts must be inlined);
swapping it is an adapter change by design, but not a free one: its fidelity needs the whole of
task 8 again.

**3. No criterion marked "recorded" has been measured.** PDF size under 10 MB, generation time,
page counts for the 50-item receipts, the `object-fit` result, the peso glyph, the Messenger and
Viber result, the 100-character wrapping: all are things the spec says to record and none has a
value. The page-count expectations (about 4, and 6 to 7) are estimates. If the 10 MB limit
fails, criterion 44 says the spec is revisited, which would reopen PNG pages versus JPEG pages:
seven PNG pages of photo content at 1800 x 2547 can plausibly exceed it. Flagged now because
the lever (a lower ratio, or JPEG) contradicts a settled decision.

**4. A one-item receipt can paginate, and "1 to 5 items is one page" is a typical case.** See
"Spec gaps". The product manager must confirm that a header-only first page is acceptable.

**5. Measurement drift.** Pagination is exact for the heights it is given; if the page node
wraps text differently from the measurement node (a different width, a font that arrived late,
a rule that applies to only one), a page overflows. The `scrollHeight` check turns that into a
loud failure instead of a clipped line, but the user then sees an error rather than a file, and
it would only appear on content that wraps near a boundary, which is the content least likely
to be in a test fixture.

**6. The success of `white` for criterion 19 and a render slot for criterion 73** are plan
decisions that differ from the spec's wording. Both are cheap to flip now.

**7. The bundle and the first click.** The two libraries are lazy, so `/create` does not pay
for them, but the first Download waits for both chunks on a mobile connection with only
"Preparing PDF..." on screen. Not prefetched (D7). If the wait is long on a real network,
prefetching on Review mount is a one-line follow-up with a data-cost argument against it.

**8. The off-screen node is a second copy of the document.** For a 50-item, 10-photo receipt
the ten data-URL photos are decoded in the preview, the measurement instance and each page
node. Acceptable on a desktop; on a phone it is memory spent next to the canvas that is the
real risk. The measurement instance is disposed before the canvas is allocated, and page nodes
are disposed one at a time.

**9. Dependency footprint.** `jspdf` unpacks to about 30 MB and brings `fflate` and `fast-png`;
`html2canvas-pro` is a small community fork. Pinning is the lockfile's job as for every other
dependency; the plan adds no wrapper beyond the two adapters, so replacing either is a
one-file change.

**10. The Receipt No. is not re-issued** (spec decision). Editing and re-exporting a draft
produces two documents with one number. Recorded in the spec's Deferred list; this plan does
nothing about it.

**11. Largest single change.** Eleven commits, a new `ui` segment in `entities`, a new feature,
two dependencies, one render-slot change to the form's public API, and a rewrite of the Review
tests. The grouping keeps each reviewable; expect `code-reviewer` findings to cluster on
pagination edge cases, the white-background CSS and the Review test rewrites.

**Deferred, not forgotten.** From `requirements.md`: very tall images in chat threads, Web Share
to Messenger and Viber, a full-size viewer on a phone, a repeated item header on continuation
pages, a selectable-text PDF, re-issuing the Receipt No., a product URL in the footer, a smaller
PNG, per-user paper size, copy review. From this plan: an automated real-browser test for canvas
and the pixel comparison (D6; the third feature this applies to), prefetching the export chunks
on Review mount, and an FSD import-boundary lint rule.
