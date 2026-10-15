# Receipt Form - Validation

Recorded 15 October 2026, on `feature/receipt-form` with tasks 1-17 in the working tree
(nothing committed yet).

Browser figures were read from the rendered page: a production build (`npm run build`,
`vite preview`), Chromium (Chrome for Testing 1234) driven by Playwright, computed styles,
colours resolved through a canvas (Chrome reports `oklch()`), and where it matters real
screenshot pixels. jsdom cannot measure layout, colour or focus, and nothing in this
document rests on jsdom for those.

Result: **71 of 72 criteria pass, 1 is unverifiable in the form the spec words it.**
The two contrast failures (54, 70) were real and are fixed (see "Failures", re-measured). Criterion 33 passes on
intent but not on its literal wording (see "Deviations").

How to read the Source column: **measured** means I took the figure myself in the browser
for this document. **tests** means the criterion is guarded by a named test; I ran the
suite and read the cases, and for the new assertions I also mutated what they guard (below).
Tests written by the builder in tasks 1-14 were not each mutated again by me. Nothing here
rests only on the builder's own report: every browser figure was re-taken.

## Gate 0 - Commands

| Check | Command | Result |
| --- | --- | --- |
| Build | `npm run build` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Tests | `npm test` | exit 0, **521 tests in 43 files** (was 497 in 41) |
| Stale legal copy | `grep -rniE "single preference\|receipts are not saved\|not written to local storage" src` | nothing outside the negative assertions |

Build warns that a chunk is over 500 kB. It did on `origin/main` too. See "Bundle".

## Tests can fail (mutation run, product code restored after each)

| Guards | Mutation | Result |
| --- | --- | --- |
| Privacy "complete list" claim | put "That is the complete list." back | `/privacy makes none of the retired claims` fails |
| Privacy "single preference" | put "A single preference is saved in" back | same test fails |
| Cookie "not saved" | put "Your receipts are not saved" back | `/cookies makes none of the retired claims` and `discloses the saved draft` fail |
| Privacy names Clear draft where removal is explained | drop "Clear draft" from the Removing your data section | `tells the reader how to remove the draft in the section about removal` fails (the first version of this test survived this mutation, because "Clear draft" also appears in another section; it is now scoped to the section) |
| Cookie names Clear draft where clearing is explained | drop it from the Clearing it section | same, for `/cookies` |
| Privacy says unencrypted | "is not encrypted" -> "is fine" | `says the draft is unencrypted and never sent anywhere` fails |
| `stored_items` lists the draft | `key: draft_storage_key` -> `key: 'receipta:other'` | 3 fail: the inventory test, the only-key-written test, the cookie table test |
| Code and inventory share one key | `draft_storage.ts` writes `'receipta:draft:v2'` | 7 fail |
| Repo rules (13 tests) | a deliberately bad file in `src/` with `useState`, `<input>`, `w-[300px]`, inline `width: 300px`, `: any`, `lucide-react`, `sonner`, a second `Intl.NumberFormat`, `toFixed`, `shared/` importing `@/features`, `interface`, and a file named `Zz-bad.tsx` | all 12 rule tests fail; the file removed afterwards |
| Back keeps everything | in `back()`, clear `notes` | `receipt_wizard_back` fails at Payment |
| Back keeps images | in `back()`, null every item image | fails at Items |
| Back keeps party type | in `back()`, reset `recipient_type` | fails at Parties |

Not guarded by any test, by nature: that `legal_last_updated` was bumped. A test cannot know
when the date should change. It is `15 October 2026` now.

## Task 15 - the legal copy (criterion 29)

The app stores user data for the first time. Before this task three published statements
were false. They now say what happens: a receipt draft, with attached photos as data URLs,
is saved in the browser's local storage under `receipta:draft:v1`, is never sent anywhere,
is not encrypted, does not expire, and is removed by Clear draft or by clearing site data.

| Where | Was | Now |
| --- | --- | --- |
| `stored_items` in `legal.ts` | one entry, the theme | two. The draft entry's key is `draft_storage_key`, imported from `shared/config/draft_storage_key.ts`, the same constant `draft_storage.ts` writes to |
| Privacy, What is stored on your device | "A single preference is saved ... That is the complete list." | "Two things are saved ...", both listed, the draft described as plain text that anyone using this browser profile can read, then "Nothing else is stored." |
| Privacy, Receipt contents | "held in your browser's memory ... Closing the tab discards it." | saved on this device as a draft so a closed tab or reload loses nothing; stays until Clear draft or clearing browser data; never sent to us or anyone else; a second paragraph says that if there is no room or storage is off the draft may not be saved and the form says so |
| Privacy, Removing your data | clear site data, or private browsing | names Clear draft first (removes everything entered, photos included), then clearing site data for everything including the theme |
| Cookies, What is not stored | "Your receipts are not saved ... Nothing about your receipts is written to local storage" | renamed "What is never sent anywhere": the draft is stored on your device as the table says, not uploaded, no server |
| Cookies, Clearing it | "the stored preference goes with it" | names Clear draft, says both items go with site data, and says what each removal costs |
| `legal_last_updated` | 12 October 2026 | 15 October 2026 |

Re-read and left alone, because they are about leaving the device and stay true: the home
hero ("nothing leaves your device"), `home_privacy` ("Your receipts never leave your
device ... There is nothing for us to store, because we never receive any of it"), the FAQ
"Where is my data stored?" answer ("On your device, and nowhere else"), and the Privacy
sections "The short version", "What we collect" and "What we do not do". "We" there is the
operator and no server exists, so none of them claims the browser stores nothing.

Added guards: the stale-claim negatives (8 retired phrases, on both pages), both pages
mention the draft, photos and Clear draft, Clear draft is in the removal section of each,
the cookie table has the draft row under the code's key and exactly two rows, and the
feature's own `draft_storage.test.ts` asserts a saved draft writes one key and that key is
in `stored_items`. Those tests live in `legal_pages.test.tsx` and `draft_storage.test.ts`.

**For the author:** this is a promise to users. A test pins the wording; a person should
read both pages in the browser before merging. The draft sits in plain text with no expiry
(plan risk 3). The copy now says so. Whether a draft should expire is still yours to decide.

## Acceptance criteria

Result: pass, **FAIL**, or **UNVERIFIABLE**.

| # | Result | Source | Evidence |
| --- | --- | --- | --- |
| 1 | pass | tests, checked | `router.test.tsx` "renders the receipt wizard at /create". `src/pages/create/ui/` holds only `create_page.tsx`; `create_placeholder_page.tsx` is deleted |
| 2 | pass | tests, measured | Test "only the Parties fields in the DOM". Browser: h2s in order Parties, Items, Payment, Review |
| 3 | pass | tests | Divergence cases for steps 1-3: Next does not advance, each invalid field shows its error, `document.activeElement` is the first `aria-invalid` element |
| 4 | pass | tests | "defaults both toggles to Individual and relabels without adding a field" |
| 5 | pass | tests | `items_step.test`: no valid item blocks Next; only item cannot be removed and says why; 51st refused with a message that stays |
| 6 | pass | tests | `payment_step.test`: method required, Other text only for Other, date rules |
| 7 | pass | tests, mutated | New `receipt_wizard_back.test.tsx`: types every step through the UI (both parties, two items, quantity 3, discount, photo, Maya, reference, date, notes), goes Review to Parties reading every control at each step, then forward to Review. Review text identical, photo still there. Three mutations fail it |
| 8 | pass | tests, measured | Test "goes to a completed step without validating". Browser at step 1: no timeline step is a button. At Review: the three earlier steps are buttons, current is not |
| 9 | pass | tests | `money.test.ts`: 999,999.99 and 9,999.999 exact, `0.1 x 3`, `19.99 x 3` (₱59.97), exact half centavo rounds up, discount equal to subtotal |
| 10 | pass | tests | `receipt_totals.test`: three 0.5 x 0.01 lines total 3 centavos, not 2; also in `items_step.test` |
| 11 | pass | tests | `money.test`: each listed input has its own reason code (`exponent`, `leading_decimal`, `multiple_points`, `bad_thousands`, `currency_symbol`, `inner_space`, `too_many_decimals`, `not_a_number`) and the accepted ones parse |
| 12 | pass | tests | Over-limit price and quantity rejected; discount over subtotal rejected, total never negative |
| 13 | pass | tests, measured | `format_currency.test` (₱1,234.50). `repo_rules.test`: `Intl.NumberFormat` appears in exactly one source file, `shared/lib/format_currency.ts`; no `toFixed` or `toLocaleString`. Browser Review shows ₱1,999,999.98 for 2 x 999,999.99 |
| 14 | pass | tests, measured | "has no VAT line or field". Browser text search of all four steps: no `VAT`, `TIN` |
| 15 | pass | tests, measured | `receipt_number.test` (fixed clock, midnight, single digits). Browser: `REF-20261015-231403` at 23:14 local |
| 16 | pass | tests, measured | Browser: Receipt No. identical before and after a reload. Rendered as text, not an input (`review_step.test`). Changes only after Clear draft (`receipt_wizard_draft.test`: new number `REF-20261015-120507` from a fixed clock) |
| 17 | pass | tests | `receipt_date.test`: early morning in Manila and late evening in Los Angeles both differ from UTC; future rejected, today and past accepted; the input has `max` |
| 18 | **UNVERIFIABLE** as worded | measured | The criterion asks for "a real photo". I have no phone photo. With synthetic fixtures in Chromium every measurable part passes, listed under "Images". Safari, and a real iPhone portrait, are the author's check below |
| 19 | pass | tests, measured | Browser messages: text renamed .jpg "That file is not an image", GIF, SVG, 11 MB "over 10 MB". 11th photo refused: `item_image_field.test` |
| 20 | pass | tests, measured | Browser: Remove photo leaves the draft with `image: null`, focus on "Add photo for item 1" |
| 21 | pass | tests | `item_image_field.test` "refuses an attach that would cross the draft guard, and leaves the form unchanged". Not exercised in a browser |
| 22 | pass | tests, measured | Browser: nothing written on load; nothing at 150 ms; written by 850 ms; reload restores step, values and Receipt No. Unit test pins 499 ms against 500 ms with fake timers |
| 23 | pass | tests | `pagehide` and `visibilitychange` flush tests. Not exercised in a browser |
| 24 | pass | tests, measured | Real quota in Chromium, not a stub (see "Draft"): "Saved without photos", `role="status"` |
| 25 | pass | tests, measured | Real quota: "Not saved", `role="alert"`, last good draft byte-identical, cleared once space was freed and an edit made |
| 26 | pass | tests, measured | A throwing `localStorage` getter in Chromium: form advances, "Not saved" alert shown. This is a stand-in for Safari private mode, not the real thing |
| 27 | pass | tests | `it.each` for corrupt, wrong version and invalid shape: notice shown, starts empty, no throw |
| 28 | pass | tests, measured | Browser: Keep draft keeps value and key; Clear draft removes the key, empties the form, returns to Parties, toast "Draft cleared". New Receipt No. is in the test |
| 29 | pass | tests, checked | Task 15 above |
| 30 | pass | checked | `app_input.tsx` built on `input.tsx`, snake_case, imports resolve (build exits 0) |
| 31 | pass | tests | `app_input.test`: no colour literal in the component or `control_style.ts`; shares the focus ring classes with `Button` |
| 32 | pass | checked | `form_field.tsx` is in `features/receipt_form/ui/`; no `form_field` under `shared/` |
| 33 | pass, with a deviation | checked, tests | FSD direction holds: `repo_rules.test` finds no `shared/` file importing `features`, `entities`, `widgets`, `pages` or `app`. The literal clause "`form_field.tsx` imports `AppInput` and `AppTextarea`" is not how it was built: `FormField` takes the control as a render prop and the step files import `AppInput` and `AppTextarea` themselves. Behaviour is the same |
| 34 | pass | tests, checked | `repo_rules.test`: the only `<input` and `<textarea` in `src` are in the shadcn `input.tsx` and `textarea.tsx`. Every `AppInput` and `AppTextarea` use sits inside a `FormField` in the step files. The Radix radio's hidden bubble input is Radix's, not ours |
| 35 | pass | tests, measured | Browser, steps 1-3 at 320: every control has a label (`labels` or `aria-label`), no control has a `placeholder` attribute |
| 36 | pass | tests | `form_field.test` and the divergence test: `aria-invalid="true"` and an `aria-describedby` that resolves to the error text; none when valid |
| 37 | pass | tests | "says Required or Optional as text" |
| 38 | pass | tests | New `repo_rules.test`: in the step files the only `useState` is `focus_request` in `items_step.tsx` (where to put focus after Add item). No field value |
| 39 | pass | tests | `app_input.test`, `app_textarea.test`, `form_field.test`: label, error wiring, adornment, ref forwarding |
| 40 | pass | tests | "receives the same control classes as AppInput" |
| 41 | pass | tests | "is the only multi-line field in the form, and it is last" |
| 42 | pass | tests | "treats empty and whitespace-only Notes as no notes, with no error" |
| 43 | pass | tests | `field_rules.test` validator cases: 300 / 301, five / six lines, CRLF, control characters |
| 44 | pass | tests | `review_step.test`: HTML and `<script>` render as literal text, line breaks kept |
| 45 | pass | tests | Saved and restored (`receipt_wizard_draft.test`), kept through Back (new back test), cleared by Clear draft (`fresh.values.notes === ''`) |
| 46 | pass | tests | "has no Notes heading or placeholder when Notes is empty" |
| 47 | pass | tests | `form_field.test`: visible count, not a live region; hint listed in `aria-describedby`; payment test names the limit |
| 48 | pass | tests, measured | `<ol>` of four, `aria-current="step"` on the current `li`, state text "completed", "current", "not yet reached" read from the DOM at 320 and 1280 |
| 49 | pass | tests, measured | Completed steps are buttons, current and upcoming are not (browser, both widths) |
| 50 | pass | tests | "moves focus to the step heading and announces the step on a change". Whether a screen reader reads it is not verified, see below |
| 51 | pass | tests | New-to-this-task check: `receipt_wizard_keyboard.test` goes Parties to Review with `user.tab` and `user.keyboard`, never a click, including the picker (Enter, type, Enter) and the date |
| 52 | pass | tests | "pressing Enter inside a text field advances", "Enter on Add item adds a row and does not advance" |
| 53 | pass | tests | `payment_step.test`: arrow keys, filter, Enter, Escape, each its own test |
| 54 | pass (was FAIL) | measured | Fixed and re-measured from rendered pixels, production build. Every indicator is now 6.08:1 light and 6.50:1 dark against its surface: timeline buttons (solid ring), Back, Add item and Add photo in dark (ring border restored), highlighted picker option (2px inset ring). See "Failures" |
| 55 | pass | tests | Picker lists 31 institutions plus Cash and Other, each logo `src` equals the institution's `icon` |
| 56 | pass | tests | Same test: every logo `src` begins with `/`. I did not watch the network tab |
| 57 | pass | tests | Cash hides Reference No. and omits it from Review; switching back restores the typed value |
| 58 | pass | tests | 41 characters rejected, never prefilled |
| 59 | pass | tests | `review_step.test` "shows every field, formatted", Discount only above 0 |
| 60 | pass | tests | "has an Edit button per section that goes to the right step and returns with data intact" |
| 61 | pass | tests, measured | No export, download or print control; browser search of `main` buttons and links for export, download, print, pdf found none |
| 62 | pass | tests, measured | Review at 320 with 50 items: the notice starts 28 px below the totals and ends 68 px below them. It is the next thing after the totals, so it is on screen when they are |
| 63 | pass | tests, measured | Browser, all four steps: "Official Receipt" appears once in total, in the Review notice, "BIR" once; no `OR No`, `Invoice`, `Serial`, `TIN`, `VAT`, and none in a label, heading, aria-label or test id |
| 64 | pass | measured | See "Layout". 16 combinations of width, theme and data, every step, no horizontal scroll, no element past the viewport. Includes Review with 50 items and a 100-character unbroken name |
| 65 | pass | measured | See "Layout". Rail at 1024 and 1280, strip at 320 and 768, completed steps reachable, no step name truncated |
| 66 | pass | measured | See "Layout". 320 px: Back and Next 246 px, the full width of their container, 50 px tall. Every text control 44 px tall and 16 px font |
| 67 | pass, with a note | measured | See "Visual consistency". No new font size, family or weight against the home page. Two new colour tokens, which the spec said there would be none of |
| 68 | pass | tests | `repo_rules.test`: no `w-[`, `h-[`, `size-[` or `min/max-` variants in any non-test source, and no inline pixel width or height. The one exemption is `dropdown_menu.tsx`, generated shadcn code that predates this feature |
| 69 | pass | measured | See "Reduced motion" |
| 70 | pass (was FAIL) | measured | Text passes in both themes. Input border, rendered pixels: light 3.64 outside / 3.48 against the control fill; dark 3.77 outside / 3.33 against the fill (was 1.89 / 1.67). See "Failures" |
| 71 | pass | tests, checked | Snake_case files, no `any`, no interface outside the router augmentation, `react-icons` only (`lucide-react` only in `shared/ui`), no other toast library, `shared/` imports nothing upward. Components are PascalCase and hooks `useReceiptForm`, `useReceiptWizard`, `useDraftAutosave` |
| 72 | pass | checked | Gate 0 |

Tally: **71 pass, 0 fail, 1 unverifiable (18).** 54 and 70 failed on the first pass and were fixed.

## Failures (both fixed; the original findings are kept, with the re-measurement under each)

### Criterion 70 - the dark input border is 1.64:1, not 3:1

Light is fine. In dark the input and textarea border is `--control-border: var(--input)`,
which is white at 16% opacity.

| | Light | Dark |
| --- | --- | --- |
| Input border against the card, computed | 3.64:1 | 1.64:1 |
| Input border against the card, rendered pixels | 3.64:1 (`rgb(123,135,153)` on white) | **1.89:1** (`rgb(66,71,79)` on `rgb(19,25,35)`) |
| Invalid border (`border-destructive/50` in dark) | 4.77:1 | 2.40:1 |

The comment in `index.css`, "--input already reads 3.66:1 on --card and 3.90:1 on
--background here", is wrong. The earlier contrast script composited the 16% alpha in
linear light; the browser composites in gamma-encoded sRGB, which is what the user sees.
The same border colour drives the picker trigger, the textarea, and the unchecked party
radios, so all of them are 1.64:1 in dark. Fix is a solid dark value, for example the
`oklch(0.62 0.03 257)` light uses re-tuned for the dark card, then re-measured from pixels.
I did not change it.

**Fixed.** Dark `--control-border` is now the solid `oklch(0.56 0.03 257)` and the wrong
3.66:1 comment in `index.css` is replaced with the rendered figures and the reason. All
figures below are from screenshot pixels of a production build, with the contrast taken
between the rendered colours (never a computed colour). Border, outside = the card around
the control, inside = the control's own fill:

| Control, at rest | Light before | Light after | Dark before | Dark after |
| --- | --- | --- | --- | --- |
| Input, vs outside / vs inside | 3.64 / 3.48 | 3.64 / 3.48 (unchanged) | 1.89 / 1.67 | **3.77 / 3.33** |
| Picker trigger | 3.64 / 3.48 | unchanged | 1.89 / 1.67 | **3.77 / 3.33** |
| Textarea | 3.64 / 3.48 | unchanged | 1.89 / 1.67 | **3.77 / 3.33** |

Correction to the note above: the unchecked party radios are not driven by this token.
Each radio sits in a bordered label that uses `--control-border` (now 3.77:1), and the
label is the boundary a user finds. The 16 px circle inside keeps `--input`. The invalid
border (`border-destructive/50` in dark, 2.40:1) is not changed here: it lives in the shared
`invalid_classes` that `Button` also reads, and the error is carried by text and
`aria-invalid` as well. Still below 3:1; a decision for the author.

Text passes everywhere, measured on the composited surface:

| Element | Light (min) | Dark (min) |
| --- | --- | --- |
| Label | 10.59 | 11.49 |
| Hint and muted text | 5.51 | 7.11 |
| Error text | 4.77 | 6.10 |
| Input text | 14.03 | 14.28 |
| Placeholder | no control has a placeholder | none |

### Criterion 54 - the focus indicator is under 3:1 on some controls

Measured by tabbing with the keyboard (so `:focus-visible` applies), 450 ms after each
press so the 150 ms transition has finished, on steps 1-3 in both themes. The indicator is a
1px `--ring` border plus a 3px halo at 50% opacity. No ring is clipped by any ancestor
`overflow` on any control.

| Control | Border | Halo vs surface | Verdict |
| --- | --- | --- | --- |
| Text inputs, textarea, picker trigger, Remove item, Next | 6.08:1 light, 6.50:1 dark | 2.32 / 2.58 | pass (the border carries it) |
| Party type radios (checked, `border-primary`) | 5.12 / 4.75 | 2.17 / 2.29 | pass |
| Back, Add item, Add photo, light | 6.08 | 2.32 | pass |
| **Back, Add item, Add photo, dark** | **1.64, unchanged on focus** | 2.58 | **fail** |
| **Timeline completed-step buttons, both themes** | **none (0 px)** | **2.32 light, 2.58 dark** | **fail** |
| Picker search input | none, outline none | none | the popover has its own border; no ring of its own |
| Picker highlighted option | n/a | highlight is 1.12:1 light, 1.17:1 dark against the popover | **fail** as a 3:1 indicator |

**Fixed.** Three changes, no new colour:

- Timeline completed-step buttons: `focus-visible:ring-ring/50` became `focus-visible:ring-ring`,
  a solid ring. This file only; `focus_ring_classes` is untouched.
- Outline `Button`, dark: added `dark:focus-visible:border-ring` so the focused border is the
  ring colour instead of staying `--input`. The default `Button` and light mode are unchanged.
- Picker highlighted option: `ring-2 ring-inset ring-ring` when `data-[selected=true]`. Inset so
  nothing is clipped by the list. It shows on pointer hover too, since cmdk selects on hover.

Re-measured from pixels, indicator against its surface (halo = ring colour at 3px outside
the box; border = the 1px border where it carries the focus):

| Control | Before light | After light | Before dark | After dark |
| --- | --- | --- | --- | --- |
| Timeline Parties and Items buttons, halo | 2.30 | **6.08** | 2.57 | **6.50** |
| Back, border | 6.08 | 6.08 | 1.64 | **6.50** |
| Add item, border | 6.08 | 6.08 | 1.64 | **6.50** |
| Add photo, border | 6.08 | 6.08 | 1.64 | **6.50** |
| Picker highlighted option vs popover | 1.12 | **6.08** (inset ring) | 1.17 | **6.50** |
| Picker highlighted option, fill alone | 1.12 | 1.12 (kept as the row tint) | 1.17 | 1.17 |

Unchanged by design, same as before: default Button (Next) 2.30 / 2.57 halo with a 6.08 /
6.50 border, text input and picker trigger the same. FAQ accordion inset ring 5.38 light,
6.68 dark. Feature card hover border 1.69 light, 2.16 dark (a hover tint, not a focus
indicator). The halo figures are 2.30 and 2.57 here against 2.32 and 2.58 in the original
run: the earlier figures were computed, these are sampled pixels.

`--ring` and `--accent` were not touched. Nothing that reads them moved.

Dark outline-variant buttons lose the ring border because `dark:border-input` in the outline
variant wins over `focus-visible:border-ring`. The 2.58:1 halo is the same one the
dark-button-color spec found on `Button` before this feature existed. Screenshots of the
timeline and Back focus states are the evidence that the halo is visible but faint.

## Layout (measured)

Production build, Chromium. Each cell is every step (Parties, Items, Payment, Review),
light and dark, with the normal draft and with the worst case: 50 items, a 100-character
unbroken item name, a Japanese name with emoji, a 40-character reference.

| Width | `scrollWidth <= clientWidth` | Element past viewport |
| --- | --- | --- |
| 320 | all 16 | none |
| 768 | all 16 | none |
| 1024 | all 16 | none |
| 1280 | all 16 | none |

At 320 (Items step with 50 items, 151 controls):

| Check | Measured |
| --- | --- |
| Back and Next | 246 px wide, the same as their container; 50 px tall; stacked, Next above Back |
| Text controls | min height 44 px, min font 16 px on steps 1, 2 and 3 |
| Party type options | the label is 246 x 44 px (the radio itself is a Radix button inside it) |
| Timeline strip | "Step 1 of 4 - Parties" (browser text), completed steps are 66 x 44 px buttons |

Timeline: at 1024 the `<ol>` sits left of the form (left 37 against form 278); at 1280
(165 against 406). At 320 and 768 it is the strip. Four items, one `aria-current="step"`,
state text on every item, no label with `scrollWidth > clientWidth`. The rail's detail line
under a step is clamped to two lines with the full text in `title`; step names are never
clamped.

## Images (criterion 18, 19, 20) - Chromium, synthetic fixtures

| Input | Result |
| --- | --- |
| 4000 x 2000 landscape JPEG, no EXIF | 800 x 400, 3,588 bytes; top yellow, left red, right blue |
| Same image with EXIF orientation 6 (read from the file's bytes) | **400 x 800, portrait**; top red, right yellow, bottom blue: the correct clockwise rotation, so it is upright |
| Landscape PNG | JPEG, 800 x 400 |
| Transparent PNG (red disc) | 300 x 300, every edge and corner `rgb(255,255,255)`, disc intact |
| 3000 x 3000 noise JPEG, 3 MB | 800 x 800, **96,360 bytes** (under 120 KB) |
| 31 MB PNG, 11 MB JPEG | refused, "over 10 MB" |
| Text renamed .jpg, GIF, SVG | refused, each naming its reason |
| After Remove | draft `image: null`; focus on "Add photo for item 1" |

The EXIF fixture is a synthetic file with the orientation tag set, not a photo from a
phone. Chromium applies orientation natively. Safari is the open question.

## Draft (criteria 22-28) - Chromium

| Step | Result |
| --- | --- |
| Load fresh | nothing written |
| 150 ms after typing | not written |
| After debounce | written; reload restores step, values, Receipt No. |
| Header link away and Back | issuer value kept |
| Clear draft, Keep draft | value and key kept |
| Clear draft, confirm | key gone, form empty, Parties, toast "Draft cleared" |
| **Real quota**: filled the origin to the byte with a dummy key (5,242,488 characters), leaving 30,000 free, then attached a 96 KB photo | "Saved without photos", `role="status"`, stored draft has no image |
| Same, then filled to zero free and edited a field | "Not saved", `role="alert"`, stored draft byte-identical to before, the form kept the typed value |
| Freed the space and edited | banner gone, draft saved |
| `localStorage` getter throws | "Not saved" alert, Next still advances |

The builder stubbed `setItem`. This run used the browser's own quota, in Chromium, which
closes the gap for Chromium only. Other engines have different quotas and error names;
the code treats any exception as a failed write.

## Reduced motion (criterion 69)

Sampled `getComputedStyle` and `document.getAnimations()` every frame for 60 frames across
a Next press.

| | `no-preference` | `reduce` |
| --- | --- | --- |
| Step container transform | `translateY(8px)` easing to 0 | identity throughout |
| Step container opacity | fades 0 to 1 | fades 0 to 1 (no movement) |
| Timeline progress bar | scales 0.5, 0.58, 0.65, 0.69 ... | jumps 0.5 to 0.75 with no in-between frame |
| `transform` keyframes running | yes | none |

## Visual consistency (criterion 67)

Computed values on `/create` (all four steps) against the home page, light and dark,
at 1280. Screenshots of both are in the session scratchpad, not in the repo.

- Font sizes: five on `/create`; all on the home page except 24 px, which is `text-2xl`,
  a step the home page uses below `sm`. One family, three weights, all on home.
- Radii and shadows: all on home.
- Colours: every colour and surface on `/create` is an existing token, with two additions
  made by this feature: `--control-border` and `--scrim` (the dialog wash). The spec said
  no new colour. `--control-border` exists to give inputs a 3:1 border, which `--border`
  cannot; its dark value is now a solid colour after the first one failed criterion 70.
  The focus fixes added no colour: they reuse `--ring`.
- Spacing: at 320 and 1280, the only values not on the home page are `18px`
  (`lg:pt-4.5`, centring a timeline label on its disc) and `-12px` (`-mb-3`, the connector
  line between discs).

## Bundle

| | `origin/main` (7bb1c12) | This branch | Change |
| --- | --- | --- | --- |
| `index-*.js` | 604.20 kB (194.39 gzip) | 748.20 kB (231.50 gzip) | **+144.0 kB (+37.1 gzip), +24%** |
| `index-*.css` | 54.70 kB (10.24 gzip) | 71.36 kB (12.78 gzip) | +16.7 kB (+2.5 gzip) |

The branch is not behind `main`. Vite's 500 kB warning was already firing on `main`; this
feature widens it. The wizard is in the single entry chunk, not split by route. The one new
dependency is `cmdk`. Not investigated further and not changed.

## Test-suite stability: the timeout change

The builder raised `testTimeout` to 15 s and Testing Library's `asyncUtilTimeout` to 4 s
after one failure it could not reproduce. Both were reverted to their defaults (5 s, 1 s)
and the suite was run under load: twelve busy-loop processes on an 8-core machine, load
average 22-28, 12 full runs per configuration.

| Run set | Wizard failures | `home_faq` failures |
| --- | --- | --- |
| Timeouts reverted, test files as the builder left them (12 runs) | **1 run**: `receipt_wizard_keyboard` and `review_step` "Edit button per section" hit "Test timed out in 5000ms"; the next test then failed finding "Next" because the timed-out test was still running (a cascade, not a second fault) | 2 runs |
| Timeouts reverted, plus the fix below (12 runs) | **0** | 5 runs |

So the failure is real, it is a timeout and not a `findBy` timeout, and it is the tests,
not the machine. Four tests walk the whole wizard and take 1.2 to 2.2 s on an idle
machine (`back` 2.2 s, `keyboard` 1.9 s, `review_step` Edit 1.5 s, `items_step` 51st item
1.2 s). Every other test in the suite is under 0.5 s. A saturated CPU takes those four past 5 s.
The asyncUtil change was not needed: no `waitFor` or `findBy` failure appeared in 24
loaded runs.

Fix, in the tests and not in the global setting: `whole_flow_timeout` (20 s) in
`src/test/receipt_form_harness.tsx`, passed to those four tests only. `vite.config.ts` is
back to its committed state and `setup.ts` keeps only the `scrollIntoView` and
`ResizeObserver` stubs. I tried `userEvent.setup({ delay: null })` to make them cheaper;
it made no measurable difference, so it was not kept. A slow failure now costs 20 s on
four tests instead of 15 s on every test.

`home_faq.test.tsx` "removes an answer from the accessibility tree again once it is closed"
fails under load in 7 of the 24 runs. It is the known pre-existing flake, unrelated, and
left for its own PR.

## Author-facing items

### Safari check, for you to run

Open `/create` in Safari, attach a photo shot in portrait on an iPhone, and confirm it
appears upright and not sideways. EXIF orientation is verified in Chromium only, with a
synthetic fixture. Safari applies orientation when drawing an image to a canvas on its own
schedule, and this is the check most likely to find a difference.

### Not verified

- **Screen reader.** No VoiceOver or NVDA pass. Label, required, error-on-failure and the
  "Step N of 4" announcement are verified as DOM structure and live-region text, not as
  speech.
- **200% zoom** and 400% reflow. Not run.
- **A real phone with 10 photos.** Autosave cost (serialising up to 2 MB and reading it
  back every 500 ms) is unmeasured on a low-end phone. Plan risk 7 stands.
- **A real 5 MB quota fill outside Chromium.** Done in Chromium (above). The builder
  stubbed `setItem`. Safari and Firefox have not been filled.
- **Safari private mode** and any browser where `localStorage` access throws. Simulated
  with a throwing getter only.
- Firefox and Safari generally: nothing in this document was run in either.
- The picker's behaviour on a touch device and the iOS keyboard.

### Deviations from the spec's wording

- Criterion 33's `form_field.tsx` imports `AppInput`/`AppTextarea`: it does not.
- Criterion 67's "no new colour": two tokens added, `--control-border` and `--scrim`.
- Criterion 18's "real photo": a synthetic fixture.

## Deferred

- Syncing the step to browser history (plan risk 5). Browser Back leaves `/create`.
- Draft expiry (plan risk 3). The Privacy page now says it does not expire.
- Code-splitting `/create` (bundle above).
