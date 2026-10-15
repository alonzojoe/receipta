# Receipt Form - Implementation Plan

Branch `feature/receipt-form`, already cut from `main`. PR targets `main`, titled
`feature/receipt-form`. Review runs automatically on open. Commits happen only after the
author has reviewed the diff.

Input: `requirements.md` (72 criteria). Nothing in it is re-opened here. Where the spec
leaves a gap, the plan names it as a decision point, recommends, and says why.

## Order of attack, argued

The instinct was: pure logic, controls, steps, persistence, images last. Most of that
holds. One part does not.

**What holds.** Money, the parser, receipt number and date, field rules and the draft
store are pure functions with exact reject lists. They need no rendering, they are the
logic most likely to be wrong, and every later task imports them. They go first.

**What changes.** Images are the riskiest part and the only part jsdom cannot test, so
"last" is the wrong place to *learn* whether the approach works. Two different things are
bundled under "images":

1. The **pipeline** (decode, orient, flatten, downscale, re-encode to 120 KB). If the
   approach is wrong (for example `createImageBitmap` does not honour orientation in a
   target browser), the cost of finding out grows with every task built on top. Find out
   early.
2. The **UI** (attach control, thumbnails, remove, focus return, budget message). It
   depends on the Items step existing and is ordinary React.

So the pipeline's pure policy and its browser adapter are built and **proven in a real
browser at tasks 5-6**, before any control or step exists. The attach UI goes last among
the steps (task 13), because it needs the Items step and the autosave budget guard.

**Persistence logic also moves early (task 4); the wiring stays late (task 14).** The
storage failure ladder is pure once `Storage` is stubbed, and jsdom can test every branch,
so it is the one risky area that can be fully proven by unit tests. Prove it before
anything depends on it.

**The gating spike is task 9, on the smallest step.** The step gate is the likeliest bug
(see "Step gating"). It is proven on Parties (four fields, no arrays, no conditionals)
with the real wizard shell. Items and Payment then add arrays and conditional fields on a
gate that already has tests.

**The legal correction (task 15) lands in the same PR as the first write to
`localStorage`.** It sits right after autosave is wired because that is the moment the old
copy becomes false. It is a hard merge precondition, not a footnote.

## Architecture

Feature Sliced Design v1. Layer direction: `app` > `pages` > `widgets` > `features` >
`entities` > `shared`. Imports go downward only. Nothing in `shared/` or `entities/`
imports from `features/`.

```
src/
  entities/receipt/                    NEW LAYER  pure domain, no React
    index.ts
    model/
      money.ts                         parse_decimal, parse_price, parse_quantity,
                                       parse_discount, line_total, compute_totals
      limits.ts                        every numeric limit from the spec, one place
      receipt_number.ts                make_receipt_number(now)
      receipt_date.ts                  today_local(now), is_real_date, is_future
      (each has a .test.ts beside it)
  shared/
    lib/format_currency.ts             + format_centavos(centavos)  (wraps the existing
                                       formatter; still the only Intl.NumberFormat)
    config/draft_storage_key.ts        NEW  the key constant, beside theme.ts
    ui/
      control_style.ts                 NEW  shared control look (constants only)
      input.tsx, textarea.tsx          NEW  generated, then edited to use control_style
      app_input.tsx, app_textarea.tsx  NEW  the project components
      radio_group.tsx, alert_dialog.tsx, popover.tsx, command.tsx
                                       NEW  generated, snake_case, fixed
      button.tsx                       EDIT focus treatment interpolated from
                                       control_style, output byte-identical
    config/legal.ts                    EDIT stored_items + legal_last_updated
  features/receipt_form/
    index.ts                           exports ReceiptForm only
    model/
      receipt_form_values.ts           value types, make_default_values(now)
      field_rules.ts                   pure per-field validators
      step_rules.ts                    steps, step_fields, validate_step, clamp_step
      draft_schema.ts                  version, Draft type, parse_draft (shape guard)
      draft_storage.ts                 read_draft, write_draft (failure ladder)
      use_receipt_form.ts              useForm composition, hydrate from draft
      use_receipt_wizard.ts            current step, next/back/go_to, focus + announce
      use_draft_autosave.ts            debounce, flush, status
    lib/
      image_policy.ts                  accepted types, sniffing, fit_within, ladder,
                                       budget check (pure)
      image_pipeline.ts                runs the ladder with injected decode/encode
      canvas_image.ts                  browser adapter, NOT unit-testable (see below)
    ui/
      form_field.tsx                   FormField
      receipt_wizard.tsx               shell: timeline + step + nav + status + clear
      step_timeline.tsx                rail from 1024px, strip below
      step_nav.tsx                     Back / Next
      draft_status.tsx                 saved-without-photos / not-saved / unreadable
      clear_draft_button.tsx           alert dialog
      steps/parties_step.tsx, items_step.tsx, payment_step.tsx, review_step.tsx
      item_row.tsx, item_image_field.tsx, payment_method_picker.tsx,
      party_type_toggle.tsx, totals_summary.tsx
      (a .test.tsx beside each)
  pages/create/
    index.ts                           exports CreatePage
    ui/create_page.tsx                 NEW (replaces create_placeholder_page.tsx)
  app/routes/create_route.tsx          EDIT component: CreatePage
  app/router.test.tsx                  EDIT asserts "receipt builder is next" today
  pages/legal/ui/privacy_page.tsx, cookie_page.tsx   EDIT (task 15)
  test/setup.ts                        EDIT ResizeObserver, scrollIntoView stubs
vite.config.ts                         EDIT pin TZ (task 2)
```

### Decision: the pure domain goes in a new `entities/receipt` layer

The money functions and the receipt number are not form concerns. The next spec (the
styled receipt and export) needs the same line totals. Two features cannot import each
other under FSD, so if the math lives in `features/receipt_form` the export feature
either duplicates it or breaks the layering. `entities/` is the FSD home for a domain
object both can use.

Alternative: keep it in `features/receipt_form/model/` and move it later. Rejected: moving
it later is exactly the forced refactor the spec warns about for `FormField`, and creating
the directory now costs nothing. Form-specific parts (draft, field rules, steps) stay in
the feature. The spec's "one module" for money is `entities/receipt/model/money.ts`.

### Decision: form state holds the text the user typed, not centavos

The spec says unit price "is stored as integer centavos". Taken literally for form state,
typing `1.` would be rewritten under the cursor, and "reject `12.345`, never round" could
not fire because the third decimal would already be gone. So **form and draft values keep
the raw strings** (`"19.99"`, `"1.5"`); pure functions convert to integer centavos and
thousandths at validation and calculation; **all arithmetic is on integers**. This honours
the intent (no floats in math) without making the input fight the user. Reported to the
author as an interpretation of the "stored as" wording.

## Step gating with one TanStack Form instance

This is the section most likely to go wrong, so it is concrete.

**What the library actually does** (read from `@tanstack/form-core` 1.33.5, not assumed):

- Only mounted fields take part. `validateAllFields` iterates `form.fieldInfo` and skips
  any entry whose `instance` is null; `instance` is set on mount and cleared on unmount.
- Unmounting a field **keeps its value** in form state (only its errors and validation
  metadata reset). So "only the current step is in the DOM" and "Back never loses data"
  are both true by construction, as the spec says.
- `validateField(name)` on an **unmounted** field does not throw and does not fail. It
  falls back to form-level validators, and with none it returns the old (empty) errors.
  **Asking the library whether an unmounted field is valid answers "yes".** That is the
  trap.
- The `submit` cause runs a field's `onChange`, `onBlur` and `onSubmit` validators, so a
  field never touched still reports its error.

**The design.**

1. **Rules are pure functions, written once.** `field_rules.ts` holds every per-field rule
   as a plain function from value (and, where needed, other values) to
   `string | undefined`. Two consumers use the same functions: the `validators.onChange`
   of each `form.Field` (inline errors) and `validate_step`.
2. **`step_rules.ts` declares ownership:**
   - parties: `issuer_type`, `issuer_name`, `recipient_type`, `recipient_name`
   - items: `items` (and every `items[i].*`), `discount`
   - payment: `payment_method`, `other_method`, `reference_no`, `receipt_date`, `notes`
   - review: none
3. **The gate is `validate_step(step, values, now)`, a pure function over
   `form.state.values`.** It returns a map of field path to message. An empty map means
   the step may advance. It does not ask the library and does not depend on what is
   mounted, so it cannot hit the unmounted-field trap. The same function drives the draft
   restore clamp ("clamped back to the first step whose predecessors do not all
   validate").
4. **Next does two things in order:** (a) compute `validate_step`; (b) call
   `form.validateAllFields('submit')`, which, because only the current step is mounted,
   marks every visible field touched and shows its error. If (a) is empty, advance. If
   not, stay and focus the first `[aria-invalid="true"]` inside the step root (DOM order
   is visual order, so there is no second ordered field list to maintain). Focus runs in
   an effect after the render that sets `aria-invalid`, not synchronously in the handler.
5. **Hidden fields never block.** Reference No. is validated only when the method is not
   Cash; Other text only when the method is Other. Otherwise a user who typed 41
   characters, then chose Cash, is blocked by an error on a field they cannot see. The
   field validator and `validate_step` read the same predicate.
6. **Cross-field rules** (discount at most subtotal; Other text depends on method) use
   `onChangeListenTo` so editing items re-validates discount. If any line is invalid the
   discount cap is not evaluated (the subtotal is incomplete, so the message would be
   wrong); the step is blocked by the line error anyway. Live totals use valid lines only.
7. **"Completed" means earlier than the current step.** Going back to step 1 from step 3
   makes steps 2 and 3 upcoming again (not clickable) and Next re-validates them. No
   "furthest reached" state to keep in sync. Timeline clicks to completed steps skip
   validation (criterion 8); the only forward path is Next.
8. **Draft validation is a shape guard, not business validation.** `parse_draft` checks
   types and bounded sizes, so a half-typed `"12.345"` price or an empty name is a valid
   draft. If it applied the business rules, the first typo would make the draft "invalid"
   and discard the user's work.

**The test that proves it (task 9, extended in 10-11): a divergence test.** For each step,
with a deliberately invalid value, click Next and assert (i) the step did not advance,
(ii) every key in `validate_step`'s result has a visible error and `aria-invalid`,
(iii) focus is on the first of them. Plus the Cash-with-invalid-hidden-reference case,
which must advance. If the pure gate and the mounted fields ever disagree, this fails.

## Shared control style

**Where:** `src/shared/ui/control_style.ts`. A plain `.ts` file exporting string constants
only, so the "no component and non-component in one file" rule does not apply.

**Shape:** three exported strings.

- `focus_ring_classes`: the focus-visible treatment (`focus-visible:border-ring
  focus-visible:ring-3 focus-visible:ring-ring/50`), copied byte for byte from `Button`.
- `invalid_classes`: the `aria-invalid:` treatment, also from `Button`.
- `control_classes`: border, background, text, placeholder, disabled, plus the two above,
  all tokens from `index.css`, nothing else.

`AppInput` and `AppTextarea` restate none of it. They wrap the generated `Input` and
`Textarea` primitives, which are **edited after generation to take their class string from
`control_classes`**, so those files carry no look of their own. `AppInput` adds only the
adornment wrapper, `min-h-11` and `text-base` (16px, so iOS does not zoom).

**Decision: edit the generated primitives, or override with `className`.** Overriding the
shadcn defaults through `cn(...)` looks lighter but leaves two definitions fighting in
`tailwind-merge`, and any property the merge does not see as a conflict silently
survives. Editing the two files to read `control_classes` leaves one definition.
**Recommend editing.** Cost, as with every generated file here: `shadcn add input
--overwrite` would undo it, which is why the edit is one import and the look lives in
`control_style.ts`.

**Decision: extract Button's focus classes into the constant, or only compare.**
Criterion 31 wants the ring to be "the same treatment as Button's". (a) Interpolate
`focus_ring_classes` into Button's base string: a shared constant cannot drift. (b) Leave
Button alone and test that its rendered class contains the same substring. **Recommend
(a)**, guarded by a before/after check: capture Button's rendered class for each variant
before the edit, assert identical after. `button.test.tsx` must pass unchanged. If the
string is not byte-identical, fall back to (b).

## Image pipeline: what can be tested, and what cannot

jsdom has no canvas, no `createImageBitmap` and no image decoding. A test that pretends
otherwise passes without testing anything. So the pipeline is split by where each piece
can honestly be checked.

| Piece | Where | Checked by |
| --- | --- | --- |
| Accepted types (JPEG, PNG, WebP); refuse SVG, GIF, HEIC | `image_policy.ts` | Unit test |
| Sniff magic bytes so a text file renamed `.jpg` is refused | `image_policy.ts` | Unit test on small hand-built byte arrays (JPEG `FF D8 FF`, PNG signature, WebP `RIFF....WEBP`; `ftyp` for HEIC; `GIF8`; `<svg` text) |
| 10 MB source cap, refused before decoding | `image_policy.ts` | Unit test on a `File` with a faked `size`; assert the decoder was never called |
| `fit_within(w, h, 800)`: never upscale, keep aspect | `image_policy.ts` | Unit test, table: already small, portrait, exactly 800, 1px edge |
| The ladder: 800px at q0.8, quality down to 0.5, then 600px, then reject over 120 KB | `image_pipeline.ts` with **injected** `decode` and `encode` | Unit test with a fake `encode(width, quality)` returning a byte length: assert the exact sequence of attempts, stop at first success, rejection when nothing fits |
| 10-image cap; 2,000,000-character draft guard at attach | `image_policy.ts` | Unit test on `would_exceed_budget` with fake data URLs |
| Real decode, EXIF orientation, white flatten, true JPEG size | `canvas_image.ts` | **Real browser only** |

`canvas_image.ts` is deliberately thin: decode with
`createImageBitmap(file, { imageOrientation: 'from-image' })` (evergreen browsers apply
EXIF orientation when drawing; asking explicitly avoids relying on a default), draw onto a
`canvas` first filled white, `toBlob('image/jpeg', quality)`, read the blob size, close
the bitmap. No EXIF parser, no library.

**Decision: how to verify the canvas adapter.** (a) Vitest browser mode or Playwright, an
automated real-browser test; (b) a canvas polyfill in jsdom; (c) a manual check in a real
browser. (a) adds a browser binary, a runner and a CI story to a static app with no
backend. (b) tests a polyfill's decoder, not the browser's, so a pass proves nothing about
Chrome or Safari. **Recommend (c)**, scoped tightly, done early (task 6) with a throwaway
harness and recorded as evidence. Criterion 18 already says orientation is "verified in a
browser with a real photo and recorded". If export (next spec) makes canvas central,
revisit (a) as its own decision.

Criterion 18 says the first two properties are "unit-tested with a stubbed canvas". The
**size cap** is covered by the injected-encoder ladder test. The **white background**
cannot be proven by a stub (a stub records that `fillRect` was called, not that a
transparent PNG comes out white). The plan unit-tests only that the fill happens before
the draw, if that step is injectable, and treats the actual pixel as a browser check. It
does not claim more.

## Draft persistence: the failure ladder

The spec is explicit; this says how each claim is made true rather than assumed.

**Detecting failure.** No need to recognise a quota error by name (names and codes differ:
`QuotaExceededError`, code 22, Firefox's `NS_ERROR_DOM_QUOTA_REACHED`). The spec treats
quota and unavailable storage identically, so: **any exception from `setItem`, or from
touching `window.localStorage` at all, is a failed write.** No name sniffing to get wrong.

**"Does not throw" is not "worked".** Some environments (a disabled-storage extension,
some private modes) can no-op. After a successful `setItem`, the code reads the key back
and compares it to the serialised string; a mismatch counts as a failed write. Cost: one
string compare of at most about 2 MB per debounced save.

**Enforcing "never destroy the last good draft".**

- The write path calls `setItem(key, next)` and nothing else. It never calls `removeItem`
  or `clear` first and never writes a partial value. A failed `setItem` leaves the old
  value (Web Storage requires it); the code adds nothing that could break that.
- Serialise first. If the string exceeds the 2,000,000-character guard, skip the doomed
  full write and go straight to the next rung.
- Ladder: full draft, then on failure the same draft with every `image` set to null
  (retried once), then give up. Results: `saved`, `saved_without_photos`, `not_saved`.
  The form's in-memory values are never touched by any of this.
- **A real consequence:** when the without-images retry *succeeds*, it replaces the
  earlier stored draft, which did have photos. That is what the spec asks for (the user
  is told to re-attach after a reload), but it means a successful degraded save is not
  non-destructive. Only a *failed* write is. The tests pin both so neither is mistaken
  for the other.
- **Nothing is written on mount.** Hydration must not trigger a save, or an unreadable
  draft is overwritten before the user edits. The first save happens on the first user
  change, which includes a step change.

**Decision: when the Receipt No. is first stored.** Criterion 16 wants the number stable
across reloads, generated "when a fresh draft is created". Writing a draft on mount for
every visitor to `/create` stores data for people who typed nothing, and would overwrite
an unreadable draft. **Recommend not writing on mount**: the number is made in memory and
persisted with the first edit. The only visible consequence is that reloading before
typing anything shows a new number, which loses nothing. Flagged because it interprets
criterion 16.

**Other persistence details.**

- `use_draft_autosave` subscribes with `form.store.subscribe` in an effect, not
  `useStore(form.store, ...)`; the latter re-renders the wizard on every keystroke for no
  benefit. Debounce 500 ms with `useDebounceCallback` from `usehooks-ts` (already
  installed; exposes `flush` and `cancel`). No new dependency.
- Flush on `visibilitychange` to hidden, on `pagehide`, **and on unmount.** The spec lists
  the first two; unmount is added because following the header link away from `/create`
  unmounts the page without firing either, which would drop the last 500 ms of typing.
- Restore runs once, synchronously, as the `useForm` initial values (lazy initialiser),
  not in an effect: no frame of defaults, no spurious change event.
- `parse_draft` is hand-written, not a schema library. It is one small fixed shape and a
  new dependency is not justified. It is tested with corrupt, wrong-version,
  shape-invalid and newer-version fixtures.

## Tasks

Each task ends with `npm run build`, `npm run lint` and `npm test` passing before the next
begins. The verify line is what additionally proves that task.

### Task 1 - Money: parser, arithmetic, formatter (the unblocker)

`entities/receipt/model/limits.ts`, `money.ts` and tests; `format_centavos` in
`shared/lib/format_currency.ts` with its test.

- `parse_decimal(text, { decimals, min, max })` works on the string. No `parseFloat`,
  `Number()` or `parseInt` on user text. It returns scaled integers (centavos for 2,
  thousandths for 3) or a **reason code**. Message wording is a separate table keyed by
  reason and field, so tests pin codes and a copy edit does not break them.
- Reason codes, one per kind of mistake: `empty`, `not_a_number`, `exponent`, `negative`,
  `plus_sign`, `leading_decimal`, `trailing_decimal`, `multiple_points`, `bad_thousands`,
  `currency_symbol`, `inner_space`, `non_ascii_digit`, `too_many_decimals`, `zero`,
  `too_large`.
- `line_total(quantity_thousandths, price_centavos)` is `floor((q * p + 500) / 1000)` on
  integers. `compute_totals(lines, discount)` sums the rounded lines, subtracts the
  discount, returns centavos, and never rounds again.
- Decisions made in the parser so `qa-tester` does not guess: a trailing point (`5.`) is
  rejected (`trailing_decimal`), since the spec allows digits with an *optional decimal
  part* and `5.` has an empty one; `1,234` and `1,234.50` accepted; `007` becomes 7; empty
  is `empty` for price and quantity and 0 for discount.

**Decision point: "distinct message" for each input in criterion 11.** `abc`, `NaN` and
`Infinity` are three inputs of one kind (not a number). Giving each its own message would
mean a message about "Infinity". **Recommend one code per kind of mistake**, with the
message naming the field's own limit, so `12.345` (price, 2 places), `1.2345` (quantity,
3 places) and `0` for price versus quantity do differ. Tell the author; if the literal
reading is wanted, `not_a_number` splits into three codes in a small change.

**What `qa-tester` asserts (table-driven, one row per input):**

| Input | Field | Expected |
| --- | --- | --- |
| empty | price, quantity | `empty` |
| empty | discount | accepted, 0 |
| `abc`, `NaN`, `Infinity` | price | `not_a_number` |
| `1e3` | price | `exponent` |
| `-5` | price | `negative` |
| `+5` | price | `plus_sign` |
| `.5` | price | `leading_decimal` |
| `5.` | price | `trailing_decimal` |
| `1.2.3` | price | `multiple_points` |
| `1,23,4` | price | `bad_thousands` |
| `₱5` | price | `currency_symbol` |
| `5 0` | price | `inner_space` |
| Arabic-Indic and full-width digits | price | `non_ascii_digit` |
| `12.345` | price | `too_many_decimals`, never rounded to 12.35 |
| `1.2345` | quantity | `too_many_decimals` |
| `0`, `0.00` | price | `zero` |
| `0`, `0.000` | quantity | `zero` |
| `0`, `0.00` | discount | accepted |
| `1000000` | price | `too_large` |
| `10000` | quantity | `too_large` |
| `0.5` | price | 50 centavos |
| `1,234.50` | price | 123450 |
| `007` | price | 700 |
| `1.5` | quantity | 1500 |
| `999,999.99` | price | 99999999 (accepted) |
| `9,999.999` | quantity | 9999999 (accepted) |

Money arithmetic, with the numbers worked out so expectations are checked, not guessed:

| Case | Expectation |
| --- | --- |
| single item 1 x 100.00 | line 10000, total 10000 |
| `0.1 x 3` (qty 3000, price 10) | line 30 = `₱0.30` |
| `19.99 x 3` (qty 3000, price 1999) | line 5997 = `₱59.97` |
| half centavo rounds up | 0.5 x 0.01 = 500/1000 gives 1 centavo; 0.499 x 0.01 gives 0 |
| `1.5 x 0.33` | 1500 x 33 = 49500; /1000 = 49.5; gives 50 |
| per line vs once, up (criterion 10) | three lines of 0.5 x 0.01: each 1, subtotal 3. Rounding the raw 1500/1000 once gives 2. Subtotal must be 3 |
| per line vs once, down | three lines of 0.333 x 1.00: each 33.3 gives 33, subtotal 99. Rounding raw 99.9 once gives 100. Subtotal must be 99 |
| subtotal equals the sum of the lines | asserted on every multi-line fixture |
| maximum | 99,999,999 x 9,999,999 = 999,999,890,000,001, below `Number.MAX_SAFE_INTEGER` (assert that too). Divide by 1000 and round: 999,999,890,000 centavos = `₱9,999,998,900.00` (remainder 1, so it floors) |
| maximum, 50 lines | 49,999,994,500,000 centavos = `₱499,999,945,000.00`, still exact |
| discount equals subtotal | total 0 = `₱0.00` |
| discount over subtotal | rejected; total is never negative |
| discount blank | 0 |

Formatter: `format_centavos(123450)` = `₱1,234.50`; 0 = `₱0.00`; 1 = `₱0.01`; 7 =
`₱0.07`; and the maximum line above. It calls the existing `format_currency`, so there is
still one `Intl.NumberFormat`.

**Verify.** `npm test -- entities/receipt format_currency` is green with every row above
present as its own case. Mutate `line_total` to floor without the `+ 500` and the
half-centavo and per-line cases must fail; revert. `grep -rnE "parseFloat|Number\(|parseInt"
src/entities` prints nothing.

### Task 2 - Receipt number, receipt date, timezone pin

`receipt_number.ts`, `receipt_date.ts`, tests; `vite.config.ts`.

- `make_receipt_number(now)` gives `REF-YYYYMMDD-HHMMSS` from **local** getters,
  zero-padded. `today_local(now)` gives `YYYY-MM-DD` from local getters, never
  `toISOString`. `is_real_date` round-trips the parts (`2026-02-30` is rejected).
  `is_future(date, now)` compares strings against `today_local`.
- Pin the test timezone: `process.env.TZ ??= 'Asia/Manila'` at the top of `vite.config.ts`
  (evaluated in the main process before workers start, so they inherit it; `??=` lets an
  explicit `TZ=...` on the command line win). Manila because it is the user's zone.

**A gap in the spec's wording.** Criterion 17 asks for a "late-evening time that would
differ from the UTC date". In Manila (UTC+8) late evening is the *same* UTC date; the
dates differ in the **early morning** (06:00 local on 5 Jan is 22:00 UTC on 4 Jan). Late
evening differs only in zones behind UTC. So the tests include both: 06:00 local (differs
in the pinned zone) and 23:30 local (differs under `TZ=America/Los_Angeles`). Without the
pin, a CI machine in UTC would pass by accident.

**qa-tester asserts:** `new Date(2026, 0, 5, 0, 5, 9)` gives `REF-20260105-000509`
(single-digit month and day, just after midnight); `new Date(2026, 11, 31, 23, 59, 59)`
gives `REF-20261231-235959`; both match `^REF-\d{8}-\d{6}$`; the date helper accepts today
and yesterday and rejects tomorrow, `2026-02-30`, `2026-13-01`, `2026-1-5` and empty.

**Verify.** Suite green; `TZ=America/Los_Angeles npm test -- receipt_date` also green.

### Task 3 - Field rules, step rules, default values (pure)

`field_rules.ts`, `step_rules.ts`, `receipt_form_values.ts` and tests.

- Text: trim, 1-100, any control character (including newline) rejected. Other: 1-50.
  Reference: 0-40, trimmed, control characters rejected. Items array: 1-50.
- **Notes:** normalise CRLF to LF, trim, count code points with `Array.from` (so the
  visible "120 / 300" and the rule agree), at most 300 and at most 5 lines, newline
  allowed, every other control character (tab, NUL) rejected. The textarea gets **no
  `maxLength`**: a native cap silently truncates a paste and makes "301 is rejected with a
  message naming the limit" unreachable.
- `validate_step`, `clamp_step(saved_step, values, now)` as in "Step gating".
  `make_default_values(now)`: both parties Individual, one empty item with a stable `id`,
  Receipt No., today's date, payment method empty, Notes empty.
- Item `id` is a stable string stored in values and used as the React key; index keys
  misattribute focus and the image after a removal.

**qa-tester asserts (criteria 42, 43, 57):** Notes of 300 characters ok; 301 rejected with
a message containing `300`; five lines ok, six rejected; `a\r\nb` counts as two lines; tab
and NUL rejected; whitespace-only becomes empty and passes; 300 emoji count as 300.
`validate_step('payment', cash_with_41_char_reference)` is empty (a hidden field does not
block); same for stale Other text under a bank. `clamp_step(4, values with an empty item
name)` is 2; `clamp_step(3, empty issuer)` is 1; all valid keeps 4. With an invalid line,
`validate_step('items', ...)` omits the discount-cap message.

**Verify.** Tests green. `grep -n "react" src/features/receipt_form/model/field_rules.ts
src/features/receipt_form/model/step_rules.ts` prints nothing (they stay pure).

### Task 4 - Draft schema and storage, including every failure path

`draft_schema.ts`, `draft_storage.ts`, `shared/config/draft_storage_key.ts` and tests. No
React. `parse_draft(unknown)` returns the draft or a reason (`corrupt`, `wrong_version`,
`invalid_shape`). `read_draft()` gives `none | ok | unreadable`. `write_draft(draft)` gives
`saved | saved_without_photos | not_saved`. `clear_draft()`.

**qa-tester asserts, with the stubbing method:**

| Case | How | Assert |
| --- | --- | --- |
| quota error on full write | `vi.spyOn(Storage.prototype, 'setItem')` throwing `new DOMException('x', 'QuotaExceededError')` once, then real | Stored string is **byte-identical to before**; the second call has every `image` null; result `saved_without_photos` |
| retry also fails | spy throws always | stored string unchanged; result `not_saved`; exactly two `setItem` calls |
| recovery | spy throws, then restored | the next write returns `saved` |
| silent no-op | spy returns without storing | read-back mismatch is treated as failure |
| access throws | `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('x', 'SecurityError') } })` | `read_draft` does not throw; `write_draft` is `not_saved` |
| over the 2,000,000 guard | draft with oversized image strings | goes straight to the without-images write |
| never destructive | spy on `removeItem` and `clear` | neither called by `write_draft` |
| corrupt, wrong version, invalid shape, newer version | four fixtures | each yields the matching reason; none throws |
| half-filled draft | empty names, price `"12.345"` | accepted by `parse_draft` |
| key | | exactly `receipta:draft:v1` |

**Verify.** Suite green. Temporarily add a `removeItem` before `setItem` in the write path:
the "never destructive" and "unchanged after failure" tests must fail. Revert.

### Task 5 - Image policy, pipeline logic, canvas adapter

`image_policy.ts`, `image_pipeline.ts`, `canvas_image.ts`; tests for the first two.

Everything in the pipeline table marked unit test is built here. `canvas_image.ts` is
written to the thin shape above, implements the `decode`/`encode` ports that
`image_pipeline.ts` takes, and has **no test**. A comment on it says why (jsdom cannot
decode), so nobody adds an empty-shell test later.

**Size unit.** "120 KB" is taken as 120 x 1024 bytes of the encoded JPEG blob, not of the
base64 string. Worst case is then about 160 KB of base64 per image, matching the spec's
"10 x 160 KB". Written once in `limits.ts`.

**qa-tester asserts:** the sniff table (real signatures accepted; SVG text, `GIF89a`, a
HEIC `ftyp`, and plain text with a `.jpg` name each refused with a distinct reason); 10 MB
plus 1 byte refused before `decode` is called; the ladder sequence is exactly 800px at
q0.8, falling quality to 0.5, then 600px, then reject, stopping at the first result at or
under the limit; an image already under 800 is never upscaled; the 11th image refused; an
attach that crosses the 2,000,000 guard refused with a reason and one just under accepted.

**Verify.** Suite green. `grep -n "canvas\|createImageBitmap"` over `image_policy.ts` and
`image_pipeline.ts` prints nothing (the browser is isolated to the adapter).

### Task 6 - Prove the canvas adapter in a real browser, before building on it

Human in a browser. Throwaway: a temporary component or route with a file input that calls
the adapter and shows dimensions, byte size and the resulting `<img>`. **Never staged**;
`git status` is clean of it before any commit. No fixtures committed.

Files to try: a portrait phone photo with EXIF orientation 6 or 8 (the author supplies);
a 4000 px landscape JPEG; a PNG with a transparent background; a WebP; a deliberately
noisy 3000 px image to push the ladder past q0.5 into 600px; a text file renamed `.jpg`.

| Check | Pass condition |
| --- | --- |
| Orientation | The portrait photo shows upright and taller than wide in Chrome and in Safari (iOS Safari if available) |
| Flatten | Draw the output to a canvas and `getImageData` a former-transparent corner: 255,255,255 |
| Size | Output blob at most 122,880 bytes, longest edge at most 800 |
| Ladder | The noisy image ends at 600px or is refused, never stored over the limit |
| Not an image | The renamed text file is refused by the sniff before decode |
| Hygiene | No console errors; any object URL the harness creates is revoked |

**This task gates the rest.** If orientation fails in Safari, the fallback (an
`HTMLImageElement` decode, or reading the EXIF tag by hand) is decided now, while it costs
one file, not after the Items step exists. Results (browser, version, measured values) are
kept for the validation doc.

**Verify.** A recorded value per row. `git status` shows no harness.

### Task 7 - shadcn primitives, shared control style, `AppInput`, `AppTextarea`

1. `npx shadcn@latest add input textarea radio-group alert-dialog popover command`. The
   same problems as the accordion add apply, so they are steps: fix the `cn` import to
   `@/shared/lib/utils`; remove the stray `cn` dependency the CLI adds and run
   `npm install`; confirm it did not add `@radix-ui/react-*` packages (this repo uses the
   umbrella `radix-ui`) or rewrite `components.json` or `index.css`; replace any
   `transition-all` with the properties actually animated; rename to snake_case
   (`radio_group.tsx`, `alert_dialog.tsx`) and fix imports; if lint's
   `only-export-components` fires on a `*Variants` export, add exactly that name to
   `allowExportNames` and nothing else. `lucide-react` may stay inside generated files
   only. `command` brings `cmdk` (decision in task 11).
2. `control_style.ts`; edit `input.tsx` and `textarea.tsx` to read `control_classes`;
   interpolate `focus_ring_classes` into `button.tsx` with the before/after check.
3. `app_input.tsx` (adornment, ref pass-through, `inputMode`, native props) and
   `app_textarea.tsx`.

**qa-tester asserts (criteria 30, 31, 39, 40):** ref forwarding for both (the ref is the
real element); `id`, `name`, `value`, `onChange`, `aria-*`, `rows` pass through; the
adornment renders `₱` as `aria-hidden` text and is not part of the input's value; every
whitespace-separated token of `control_classes` appears in both elements' `className`
(the "same classes reach both" test); `focus_ring_classes` appears in Button's output too;
a test reads `app_input.tsx` and `control_style.ts` as text and asserts no hex, `rgb(`,
`oklch(` or named-colour utility such as `bg-white`.

**Not testable here, browser:** the 44px height and 16px computed font size (jsdom runs no
layout). `min-h-11` and `text-base` are added and the measured result is recorded in task
17. Do not assert class names for this.

**Verify.** Build, lint, test. Button's before/after class strings identical.
`git diff package.json` shows `cmdk` and no `cn`. `ls src/shared/ui` has no hyphenated
file.

### Task 8 - `FormField`

`features/receipt_form/ui/form_field.tsx` and its test.

**Decision: a render-prop for the control, not a `control="input"` switch.** The spec needs
the same label and error wiring around the toggle, the payment picker and the image
attach, none of which are `AppInput`. One mechanism covers all of them:
`<FormField field={field} label=...>{(control) => <AppInput {...control} />}</FormField>`,
where `control` carries `id`, `name`, `value`, `onChange`, `onBlur`, `aria-invalid`,
`aria-describedby`. Type the field as TanStack's exported `AnyFieldApi`, never `any`.

- `useId` for the control, message and hint ids; `htmlFor` binds the label.
- The error shows when the field is touched and has errors.
  `validateAllFields('submit')` touches every mounted field, so "Next attempted" needs no
  extra flag.
- `aria-describedby` lists only ids that exist and is absent with neither hint nor error
  (no dangling id, criterion 36). `aria-invalid="true"` only while an error shows.
- The required marker is text; "Optional" is text. The Notes count "n / 300" is plain
  text, not a live region; the limit sits in the hint that `aria-describedby` references.

**qa-tester asserts (criteria 35-37, 39, 47):** `getByLabelText` resolves the control; an
invalid field has `aria-invalid="true"` and an `aria-describedby` that resolves to an
element containing the error text; a valid field has neither; hint plus error gives both
ids; required and optional markers exist as text; the count has no `aria-live`; `label`
is a required prop, enforced by type, so a placeholder-only field cannot be built.

**Verify.** Tests green. `grep -rn "from '@/features" src/shared src/entities` prints
nothing.

### Task 9 - Wizard shell, timeline, Parties step, route swap (the gating spike)

`receipt_wizard.tsx`, `step_timeline.tsx`, `step_nav.tsx`, `party_type_toggle.tsx`,
`parties_step.tsx`, `use_receipt_form.ts`, `use_receipt_wizard.ts`, `create_page.tsx`.
Delete `create_placeholder_page.tsx`; update `create_route.tsx`, `pages/create/index.ts`
and `app/router.test.tsx` (it asserts "receipt builder is next", which stops being true).
Items, Payment and Review render a minimal placeholder heading at this commit so the
wizard navigates end to end; each is replaced in its own task.

- One `useForm` in `use_receipt_form.ts`; steps receive `form`. No step owns state.
- Each step renders inside one `<form noValidate>` whose submit handler calls Next. Next
  is the only `type="submit"`; Add item, Remove, Back, picker and attach are
  `type="button"`. That makes "Enter in a text field advances; Enter on Add item does not"
  true without key handling.
- Individual / Organization is a shadcn **radio group** (one of two; the semantics match,
  where a row of toggle buttons announces as independent buttons).
- Timeline: `<ol>`, `aria-current="step"` on the current, hidden text completed / current /
  not yet reached, completed steps are `<button>`, others are plain. Rail from `lg`
  (1024px); compact strip below with "Step 2 of 4 - Items" and four segments, same list,
  same text. Steps are **not** routed (see Risks).
- On step change, focus the step heading (`tabIndex={-1}`) and update one polite live
  region "Step N of 4: Name", in an effect keyed on the step, skipping the very first
  render so loading the page does not steal focus.
- Failed Next focuses the first `[aria-invalid="true"]` in the step, in an effect after
  the render that sets it.

**qa-tester asserts (criteria 1-4, 7 for this step, 8, 48-50):** the route renders the
wizard and `create_placeholder_page.tsx` does not exist; only the current step's fields
are in the DOM; Next on empty names stays, shows two errors, and focus is on the issuer
name; both toggles default to Individual; choosing Organization changes the label to
"Business name" and the input count is unchanged; step 1, 2, back: values intact; the
timeline `<ol>` has four items, one `aria-current`, text state per item; a completed step
is a `button`, an upcoming one is not a button and cannot be reached by Tab; clicking a
completed step goes with no validation; after a step change `document.activeElement` is
the heading and the live region reads the right text. Plus the **divergence test** for
Parties.

**Verify.** Build, lint, test. `ls src/pages/create/ui` shows `create_page.tsx` only.
Manual: `npm run dev`, press Next on an empty form, focus lands on the first field.

### Task 10 - Items step (without images)

`items_step.tsx`, `item_row.tsx`, `totals_summary.tsx`.

- `items` is an array field; name, quantity and price are `FormField` + `AppInput`
  (`inputMode="decimal"`; price with the `₱` adornment).
- Add is refused at 50 with a persistent inline message, not a silent no-op. Remove on the
  last remaining item is disabled with `aria-describedby` pointing at the reason, not only
  dimmed.
- Line subtotal per row from `line_total`, blank when the line is invalid. Subtotal,
  discount, total in `totals_summary.tsx` from `compute_totals`, all through
  `format_centavos`. No VAT line.
- Discount: `FormField` marked Optional, `onChangeListenTo: ['items']`.
- Row layout: name full width; quantity and price side by side; image and remove below.
  `min-w-0` and `break-words` on the name so 100 characters wrap.

**qa-tester asserts (criteria 5, 9-14, 52):** with no valid item Next does not advance;
the only item cannot be removed; the 51st add shows the message and the count stays 50;
a discount over the subtotal shows the error and the total is never negative; the
three-lines-of-0.5-x-0.01 fixture renders subtotal `₱0.03`, not `₱0.02`, and the subtotal
text equals the sum of the rendered line texts; `₱1,234.50` appears for 1234.5; the
rendered step contains no whole-word `VAT`; Enter on Add item adds a row and the heading
is still "Items"; removing a middle item leaves the other rows' values on the right rows.

**Verify.** Build, lint, test. The divergence test is extended to Items and passes.

### Task 11 - Payment step

`payment_step.tsx`, `payment_method_picker.tsx`.

**Decision: the picker.** It needs search, arrow keys, type-to-filter, Enter, Escape and
groups. (a) shadcn `Command` (cmdk) inside a `Popover`; (b) a hand-built input plus
`listbox`. **Recommend (a).** cmdk owns roving selection, filtering and the combobox/
listbox ARIA, which is the part a hand-built one gets subtly wrong, and CLAUDE.md says to
compose shadcn rather than hand-roll. Cost: one dependency (`cmdk`, arrived in task 7) and
`ResizeObserver` plus `Element.prototype.scrollIntoView` stubs in `src/test/setup.ts`,
which cmdk calls and jsdom lacks. If the stubs prove brittle, fall back to (b).

- Options come from `institutions_by_category()` (E-wallets, Digital banks, Banks), then
  Cash and Other. Each institution shows its `icon` as `<img alt="">` at a fixed icon size
  with the name beside it; an `onError` hides the image and leaves the name. The trigger
  always shows the selected name as text and carries the `FormField` control props, so
  `aria-invalid` and failure focus land on a focusable element.
- Other (specify) shows only for Other; Reference No. is hidden for Cash. Both are
  conditional **rendering only**; their values stay in form state.
- Receipt date: `AppInput type="date"` with `max` set to today. Recommend the native date
  input over a custom picker: a real calendar on phones for free and a `YYYY-MM-DD` string
  with no parsing. The validator still enforces real-and-not-future because `max` is
  advisory and a draft can hold anything.
- Notes: `FormField` + `AppTextarea`, last field, Optional, "n / 300", no `maxLength`.

**qa-tester asserts (criteria 6, 41-43, 53, 55-58):** options equal `institutions` (31)
plus Cash and Other, each institution `img` `src` equal to its `icon`; every `src` starts
with `/`; ArrowDown and ArrowUp move the active option, typing "gc" filters to GCash,
Enter selects it and the trigger reads "GCash", Escape closes and keeps the previous
selection; Other requires the text and a bank does not; switching to Cash hides Reference
No. and Next advances even with a 41-character hidden reference; switching back shows the
typed value; the reference is never prefilled; a future date is rejected, today and a past
date accepted; Next with empty Notes and with whitespace-only advances with no error;
301 characters shows the limit message.

**Verify.** Build, lint, test. Divergence test extended to Payment.
`grep -rn "<input\|<textarea" src/features src/pages` prints nothing.

### Task 12 - Review step

`review_step.tsx`.

Everything in the spec's "Review step" list, formatted through `format_centavos`. Edit
buttons per section call `go_to(step)`. Receipt No. and date are read-only text. Notes
render as React text in an element with `white-space: pre-wrap`, never as HTML, under a
heading that exists only when Notes is non-empty. The BIR notice sits directly after the
totals. No export, download or print control.

**qa-tester asserts (criteria 44, 46, 59-63):** every listed field present; Discount row
only above 0; Notes `<script>alert(1)</script>` appears as literal text,
`container.querySelector('script')` is null, line breaks preserved; empty Notes renders no
"Notes" heading; each Edit goes to the right step and returns with data intact; no
export, download or print control; the notice comes after the Total row in the same
container.

**The spec's own conflict, resolved.** Criterion 63 forbids "Official Receipt" in any
label, heading or test id, while 62 requires the notice to say "not a BIR Official
Receipt". Reading: the notice is body text and is the one permitted occurrence. One test
collects labels, headings and `data-testid`s and expects zero hits; another counts
"Official Receipt" in all rendered text across every step and expects exactly one, on
Review. `OR No.`, `Invoice No.`, `Serial`, `TIN` and `VAT` (whole words) expect zero in
all rendered text. Flagged to the author rather than silently narrowed.

**Verify.** Build, lint, test.

### Task 13 - Item image field

`item_image_field.tsx`, wired to `image_pipeline` and `canvas_image`; the budget guard.

- A visible, labelled trigger button opens a visually hidden `<input type="file"
  accept="image/jpeg,image/png,image/webp">` (`accept` is advisory; the sniff is the real
  gate). A processing state is shown and the control is disabled while it runs. This one
  `<input>` is the single permitted exception to the "no `<input` outside `app_input`"
  grep; either route it through `AppInput type="file"` or whitelist the file by name,
  and say which in the commit.
- Refusals show an inline `FormField` error naming the reason (type, size, count,
  budget), not a toast alone.
- Remove clears `image` in form state and moves focus to the attach trigger (ref held by
  the row).
- Attach checks the serialised draft *as it would be* with the new image and refuses at
  attach time with the reason (criterion 21).
- In tests the pipeline is injected (a prop or module seam), because jsdom cannot decode.
  The component test drives it with a fake returning a small data URL.

**qa-tester asserts (criteria 18-21):** SVG, GIF, HEIC, a renamed text file, an 11 MB file
and the 11th image each show a message naming the reason; a successful attach stores the
fake result and shows a thumbnail with empty `alt`; remove clears form state and
`document.activeElement` is the attach trigger; an attach that would cross the guard is
refused with the reason and form state is unchanged. **The validation doc must say
plainly what this does not prove:** that a real file is decoded, oriented and flattened.
That is tasks 6 and 17.

**Verify.** Build, lint, test. Repeat the task 6 checks once through the real UI: attach
the portrait photo and the transparent PNG, read the stored draft in DevTools
(Application, Local Storage), decode the data URL and confirm size, dimensions,
orientation and white corner.

### Task 14 - Autosave, restore, status, clear draft

`use_draft_autosave.ts`, `draft_status.tsx`, `clear_draft_button.tsx`; changes to
`use_receipt_form.ts` and `receipt_wizard.tsx`.

- Hydrate from `read_draft` in the form's initial values; restore the step through
  `clamp_step`; Receipt No. from the draft.
- Unreadable draft: a `role="status"` notice "A saved draft could not be read, so a new
  one was started", with nothing written until the first edit.
- `draft_status.tsx` renders nothing on `saved`; `role="status"` "Saved without photos..."
  for the degraded save; `role="alert"` "Not saved. Your work will be lost if you close
  this page." Both persist until a later save returns `saved`. Strings are the spec's.
- Clear draft on every step, via the shadcn alert dialog. Confirm removes the key, resets
  with `form.reset(make_default_values(now))`, issues a new Receipt No. and today's date,
  returns to step 1 and calls `toast.success('Draft cleared')` from `react-hot-toast`.
  Cancel changes nothing. Check `root_layout.tsx` for an existing `Toaster` before adding
  one.
- `form.reset` must remount fields cleanly; the test below is how that is checked.

**qa-tester asserts (criteria 16, 20, 22-28, 45):** with `vi.useFakeTimers()`, an edit
writes nothing at 499 ms and writes `receipta:draft:v1` at 500 ms; `pagehide` and
`visibilitychange` (with `document.visibilityState` stubbed to `hidden`) each flush a
pending write immediately; **unmount** flushes; render, fill every field including Notes
and an image, unmount, render again: every value, the step and the Receipt No. are back;
the quota-then-recover and always-fail scenarios from task 4 through the UI: the
`role="status"` text, then the `role="alert"` text, which persists across further edits
until a write succeeds; `localStorage` access throwing leaves the form fully usable and
shows the alert; corrupt, wrong-version and invalid-shape drafts show the notice, render
empty and do not throw; nothing is written on mount; Clear draft from each of the four
steps: cancel is a no-op, confirm removes the key, resets Notes, items and images, returns
to step 1, changes the Receipt No. (advance the fake clock first) and shows the toast; the
Receipt No. is unchanged across step changes and a remount.

**Verify.** Build, lint, test. Manual: type and close the tab within a second, reopen;
navigate away via the header link and back; confirm each restores. Fill the quota in
DevTools (write a large dummy key until `setItem` throws) and confirm the degraded states
appear and the old draft is intact in Application, Local Storage.

### Task 15 - Legal copy correction (a correctness task)

Found by reading the files. Today the product says things this feature makes false:

- `legal.ts` `stored_items` lists only the theme key.
- `privacy_page.tsx`, "What is stored on your device": "A single preference is saved...
  That is the complete list."
- `privacy_page.tsx`, "Receipt contents": "held in your browser's memory while the page is
  open... Closing the tab discards it."
- `privacy_page.tsx`, "Removing your data": omits Clear draft.
- `cookie_page.tsx`, "What is not stored": "Your receipts are not saved... Nothing about
  your receipts is written to local storage."
- `cookie_page.tsx`, "Clearing it": "the stored preference goes with it", singular.
- `legal_last_updated` is `'12 October 2026'`.

**Do the shipped tests pin the current wording? No.** `legal_pages.test.tsx` checks
headings, the shared date through the exported constant, heading order, the BIR line in
Terms, the heading "sets no cookies", that the cookie table has one row per `stored_items`
entry (so adding an entry is fine and expected), and that the theme key is in
`stored_items`. None asserts "a single preference" or "not saved", so the correction
breaks no test. It also means **no existing test would have caught the stale copy**, which
is why this task adds some.

Changes:

- `stored_items` gains an entry: key `receipta:draft:v1`, purpose (the receipt in
  progress, so it survives a closed tab), values (honestly: names, item details, amounts,
  payment method and reference, notes, and shrunken item photos), duration (until you use
  Clear draft or clear browser data). `shared/` may not import from `features/`, so the
  key constant lives in `shared/config/draft_storage_key.ts` (created in task 4), beside
  `theme_storage_key`, and both the feature's storage code and `legal.ts` import it. Same
  pattern the theme key already uses, and it makes the test below meaningful: the
  published page and the code cannot name different keys.
- Privacy: "What is stored" lists both items and drops "complete list" wording unless it
  is true; "Receipt contents" says the in-progress receipt is saved on this device and how
  to remove it; "Removing your data" names Clear draft. The summary and "What we collect"
  stay true (nothing is transmitted); re-read them rather than assuming.
- Cookies: "What is not stored" is renamed and rewritten (nothing is uploaded; the draft is
  stored locally); "Clearing it" covers both items.
- Home page copy ("Your receipts never leave your device", the FAQ "Where is my data
  stored?" answer) is about leaving the device, not persistence, and stays true. Re-read
  it in this task and record that it was checked; do not edit it.
- `legal_last_updated` becomes the date of the change, as its own comment requires.

**qa-tester asserts (criterion 29 and more):** `stored_items` contains `receipta:draft:v1`
and equals the constant the draft storage writes to; the existing one-row-per-item cookie
test still passes with two items; the rendered Privacy and Cookie pages do **not** contain
"Your receipts are not saved", "A single preference" or "That is the complete list"
(negative assertions on the false claims, so they cannot return); both pages mention the
draft and Clear draft; the shared date appears.

**Verify.** Build, lint, test. `grep -rniE "single preference|receipts are not
saved|not written to local storage" src` prints nothing outside the negative assertions.
The author reads both pages in the browser: this is a promise to users, and a person
should read it, not only a test. **Merge precondition:** this task's commit is in the PR.

### Task 16 - Whole-flow tests and the repository checks

`receipt_wizard.test.tsx`.

- **Back keeps everything (criterion 7):** fill every step including an image (injected
  pipeline), go back to step 1, check every value, return to Review, check again.
- **Keyboard only (criterion 51):** one test using `userEvent.keyboard` and `tab`, never a
  click, from Parties to Review, including opening the payment picker and the date.
- Repository checks, recorded as a test or a checklist: no `useState` holding field values
  in step files (criterion 38); no `<input`/`<textarea` outside `app_input`,
  `app_textarea`, the generated `input` and `textarea`, and the file input; no `w-[`,
  `h-[`, `size-[` or fixed pixel dimensions on a non-icon in any new file (criterion 68);
  no `any`; icons only from `react-icons`; `Intl.NumberFormat` appears in exactly one
  source file (criterion 13); `grep -rn "toFixed\|toLocaleString" src` shows no money use.

**Verify.** Build, lint and test all exit 0 (criterion 72).

### Task 17 - Verify in a browser and record

All of this needs a human in a browser. None of it can be checked in jsdom, and the plan
does not pretend otherwise. `qa-tester` produces the validation doc; this plan does not.

| Criterion | What to do |
| --- | --- |
| 18, 54 | Task 6 results repeated through the real UI; focus ring on every control in both themes at 3:1, unclipped at the rail edge and inside the picker popover |
| 64 | 320, 768, 1280 on every step, including Review with 50 items and a 100-character name: `scrollWidth <= clientWidth` |
| 65 | Rail at 1280 and strip at 320, completed steps reachable, step names not truncated |
| 66 | At 320: Back and Next full width and at least 44px; every input at least 44px with computed font-size at least 16px |
| 67 | Screenshots in light and dark compared with the home page: no new size, spacing step or colour |
| 69 | Emulate `prefers-reduced-motion: reduce`: step changes have no movement |
| 70 | Text, hint, error and placeholder at 4.5:1 and input border at 3:1, both themes, measured |
| 62 | At 320 the BIR notice is on screen without scrolling past the totals |
| draft | Close the tab and reopen; navigate away and back; fill the quota; disable storage (Safari private mode) |
| autosave cost | Type with 10 images attached on a real mid-range phone; note any input lag |
| screen reader | One VoiceOver pass over Parties and the payment picker: label, required, error read on failure, step announcement |

**Verify.** Each row has a recorded value, not a tick.

## Commit grouping

| Commit | Covers |
| --- | --- |
| `docs: add receipt form spec and plan` | `requirements.md`, `plan.md` |
| `feat: add receipt money, number and date logic` | tasks 1-2 |
| `feat: add receipt form rules and draft storage` | tasks 3-4 |
| `feat: add item image processing` | task 5 (task 6 produces no commit) |
| `chore: add shadcn input, textarea, radio group, dialog, popover and command` | task 7 step 1 only: generated code and its hand fixes |
| `feat: add shared app input and textarea` | task 7 steps 2-3 |
| `feat: add receipt form field` | task 8 |
| `feat: add receipt wizard with parties step` | task 9 |
| `feat: add items, payment and review steps` | tasks 10-12 |
| `feat: attach images to receipt items` | task 13 |
| `feat: autosave the receipt draft` | task 14 |
| `fix: disclose the saved draft in the privacy and cookie pages` | task 15 |
| `test: cover the receipt form end to end` | task 16 |
| `docs: record receipt form validation` | task 17, written by `qa-tester` |

Grouping notes. Tasks 1-2 and 3-4 are pure logic that can be reviewed without a browser,
each pair sharing one concern. Task 7 is split so generated code stays separate from ours,
as in the accordion plan. Tasks 10-12 are one commit because the task 9 commit holds
placeholders for them and none is useful alone. Tasks 14 and 15 are separate commits, but
**both must be in the PR before it is marked ready**. `fix:` for task 15 because the
published copy is wrong once task 14 exists; it is a correction, not a feature.

## Criteria coverage

| Criteria | Task |
| --- | --- |
| 9-13 (money, parser, formatter) | 1, 10 |
| 14 | 10 |
| 15-17 | 2, 14 |
| 1-4, 8, 48-50 | 9 |
| 5 | 10 |
| 6, 41-43, 53, 55-58 | 11 |
| 59-63 | 12 |
| 18-21 | 5, 6, 13, 17 |
| 22-28, 45 | 4, 14 |
| 29 | 15 |
| 30-33, 39, 40 | 7, 8 |
| 34-38 | 11, 16 |
| 7, 51, 52 | 10, 16 |
| 54, 64-70 | 17 |
| 71, 72 | every task; 16 |

## Risks

**1. The step gate is the likeliest source of a subtle bug.** `validateField` on an
unmounted field returns "valid", `validateAllFields` skips unmounted fields, and unmount
keeps values. A gate built on the library's own flags (`isValid`, `canSubmit`, field
`errors`) passes for the wrong reason or blocks for an invisible one. The plan makes a
pure function over values the authority and the mounted fields a display of it. Still
exposed: the pure function and the field validators must stay in step, and a field added
without an entry in `step_fields` is silently ungated. The divergence test is the guard;
`code-reviewer` should check `step_fields` against every field of any later change.

**2. Image processing cannot be verified in jsdom, and the plan says so.** The ladder,
the sniffing and the budget are unit-tested. Decoding, EXIF orientation, white flattening
and real byte size rest on one manual browser check, recorded once. A later browser change
or an untested Safari quirk would not be caught by `npm test`. Task 6 runs early and the
check is repeated through the real UI. Not mitigated: HEIC from iPhones is refused by
design, and a user who hits it gets a message, not a conversion. Expect support questions;
the message should say how to get a JPEG.

**3. The app stores user data for the first time, so the legal copy is a correctness
issue, not documentation.** The Privacy and Cookie pages say receipts are not saved and
that a single preference is stored. After this feature that is a published false statement
about user data, in a product whose pitch is privacy. No existing test would catch it,
hence task 15's negative assertions and shared key constant. Related and undecided:
customers' names and amounts sit in plain text in `localStorage`, unencrypted, with no
expiry, on a possibly shared device. The disclosure should say so plainly, and the author
should decide whether a draft expires.

**4. Interpretations of the spec the author should confirm.** Form state holds typed text,
not centavos; the Receipt No. is stored on the first edit, not on mount; "distinct
message" means one per kind of mistake; the criterion 62/63 "Official Receipt" conflict is
resolved as exactly one occurrence, in the Review notice; "completed" means earlier than
the current step; the 120 KB cap is bytes of the encoded blob; the date tests cover early
morning because late evening does not differ from UTC in Manila. Each is cheap to flip
now and expensive to flip late.

**5. Steps are not in the URL.** Browser Back, or the Android hardware Back button, leaves
`/create` instead of going to the previous step. The draft survives, so nothing is lost,
but on a phone-first form this will surprise people. Syncing the step to history is real
extra work (each entry interacts with the restore clamp) and the spec is silent, so it is
deferred and flagged, not decided.

**6. `cmdk` adds a dependency and jsdom stubs.** `ResizeObserver` and `scrollIntoView`
stubs in the shared setup file affect every test file. If the picker tests turn flaky, the
fallback is the hand-built listbox, at the cost of ARIA work.

**7. Autosave cost is unmeasured.** Serialising up to 2 MB plus a read-back compare every
500 ms of typing is fine on a desktop and may block the main thread for tens of
milliseconds on a low-end phone. Checked in task 17. If it janks: a longer debounce while
images are present, or storing images under a second key written only when they change.

**8. Generated primitive drift.** Input, textarea and button are hand-edited to read the
shared control style, and `shadcn add --overwrite` undoes the edits. The edits are one
import each; the Button before/after check and the "same classes reach both" test are what
notice a regression.

**9. Stale Receipt No. and date.** A draft left for days keeps a stale number and default
date. Accepted by the spec; the export spec may re-issue. Not addressed here.

**10. No FSD lint boundary.** The ESLint config has no import-boundary rule, so layer
direction is enforced by the greps in tasks 8 and 16 and by `code-reviewer`, not by the
tool. Adding a plugin is a new dependency and a separate decision.

**11. Largest single change.** Fourteen commits, a new FSD layer, six generated
primitives and one new dependency. The grouping keeps each reviewable, but the PR will
be large; expect `code-reviewer` findings to cluster on the gate and the storage ladder.

**Deferred, not forgotten.** From `requirements.md`: the styled receipt, PDF and image
export, percentage discount, zero-priced items, IndexedDB, issuer pre-fill, promoting
`FormField`, multiple drafts, per-field save status, drag-to-reorder, copy review. From
this plan: step-in-URL history, draft expiry, an automated real-browser test for canvas,
an FSD import-boundary lint rule.
