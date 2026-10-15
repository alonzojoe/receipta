# Receipt Form - Requirements

## Goal

`/create` is a "coming soon" placeholder. Replace it with the form a seller fills in to
describe a payment they received: who issued the receipt, who it is for, what was sold,
and how they were paid. The form is a four-step wizard with a timeline, so a phone user
sees one small task at a time instead of one long page. The draft autosaves in the
browser, so a dropped connection, a closed tab, or a call from the client does not cost
them the work.

This spec is the **form only**. The last step shows a plain summary for checking the
data. How the finished receipt looks, and exporting it as PDF or image, are the next spec.
Nothing here renders a styled receipt.

Receipta is not a BIR Official Receipt. Nothing in this form may suggest otherwise (see
"The BIR line" below).

## Decisions

Settled by the author, not to be re-argued:

| Decision | Choice | Why |
| --- | --- | --- |
| Shape | **Wizard, one step at a time**, timeline down the left (done / current / upcoming), Back and Next. A step must validate before it advances. Only the current step is visible. | Author's call. |
| Parties | Issuer and recipient, each with an **Individual / Organization** toggle, defaulting to **Individual**. Organization changes only the label ("Full name" becomes "Business name"). No extra fields. No address, no TIN, no contact person. | Author's call. Same shape either way keeps the data model and the later receipt simple. A TIN field would also invite the comparison with an Official Receipt. |
| Items | Multiple. Each has name, quantity, unit price, optional image. | Author's call. |
| Payment | **One method per receipt**: one of the 31 institutions (with logos), **Cash**, or **Other** (free text). Optional Payment Reference No. attaches to it. | Author's call. |
| Draft | Autosaves to localStorage, restores on return, with a way to clear it. | Author's call. |

Settled by this spec:

| Decision | Choice | Why |
| --- | --- | --- |
| Steps | **1 Parties, 2 Items, 3 Payment, 4 Review.** The author's sketch is confirmed. Discount lives on Items (it needs the subtotal beside it). Receipt date lives on Payment (it is the date the money arrived). | Parties is two fields per side; splitting issuer and recipient would give two steps of one field each. Four steps is the fewest that keeps each step a single concern. Review is a step, not a page, so Back works the same everywhere. |
| Timeline navigation | Completed steps are clickable and jump back with no validation. Upcoming steps are not clickable. Forward movement is only through Next. | Letting a user jump back to fix a typo is expected. Letting them jump forward would bypass validation, which is the point of the wizard. |
| One form instance | A single TanStack Form instance holds the whole receipt; steps are views onto it. Step changes never reset or remount-and-clear values. | Going Back must not lose data. Per-step forms would each need to sync into a store. One instance makes "Back keeps data" true by construction. |
| Discount | **Fixed peso amount only.** Optional; blank means 0. Must not exceed the subtotal. Shown beneath the subtotal on the Items step and in the Review. | Sellers state discounts as "₱50 off". A percentage mode adds a toggle and a second rounding path, in the logic most likely to be wrong. Percent is Deferred. |
| Money arithmetic | **Integer arithmetic only.** Unit price is stored as integer centavos, quantity as integer thousandths. | `0.1 + 0.2` style float error is the classic receipt bug. The unit tests pin this. |
| Rounding | `line = round_half_up(quantity_thousandths * price_centavos / 1000)` centavos, **rounded once per line**, then lines are summed to the subtotal. Total = subtotal - discount. Never rounded again. | Rounding per line means the printed lines add up to the printed subtotal exactly. Rounding only the grand total leaves a client who checks the sum with a centavo that does not reconcile. Prices are limited to 2 decimals on input (rejected, not silently rounded), so rounding only ever occurs where quantity has a fraction. Half-up, because all amounts are positive and it matches what people do by hand. |
| Receipt No. | `REF-YYYYMMDD-HHMMSS` in **the device's local time**, generated **once when a fresh draft is created**, stored in the draft, **not editable**, shown read-only on Review. A cleared draft gets a new one on the next fresh draft. | Stable across reloads and step changes, so what the user sees on Review is what they would later export. Not editable because a free-typed number is exactly how a receipt starts to impersonate a numbered Official Receipt. Local time because the user reads this number against their own clock. The cost: a draft left for days carries a stale timestamp. The export spec may decide to re-issue the number at export; that is its call, flagged under Deferred. |
| Receipt date | Defaults to **today (local)** when the draft is created. Editable. Must not be in the future. Past dates allowed. Stored as `YYYY-MM-DD`. | Receipta documents a payment that already happened, so a future date is wrong by definition. Past dates are legitimate (issuing a receipt a day late). |
| Item images | Downscaled in the browser before storage, capped per image and per receipt. See "Item images and the storage budget". | The real tension in this spec: see below. |
| Notes | One optional free-text **Notes** value, on the **Payment** step as its last field. Multi-line, **300 characters and 5 lines maximum**, empty is normal. Saved in the draft. Shown on Review when not empty. | It describes the receipt as a whole ("paid in two parts", "thank you"), not a line, so it does not belong beside a party or an item. The author asked for it below the money. The Items step is already the heaviest (rows, images, discount, totals) and hardest at 320px, so the Payment step, which follows the money and is the last data entry before Review, takes it. 300 characters is about two or three sentences and, at 5 lines, a bound the later receipt layout can budget for; a pasted essay cannot push the totals off the page. Newlines are allowed so a short list reads as one, but capped so line count is bounded as well as length. |
| Component placement | `AppInput` and `AppTextarea` are **shared primitives** in `src/shared/ui/`. `FormField` is **feature-local**, in `src/features/receipt_form/ui/form_field.tsx`. | An input's look is app-wide and reusable. The label-plus-error layout is specific to this form, so `shared/ui` stays minimal. Feature Sliced Design only allows a slice to import from layers below it: `FormField` (feature) importing `AppInput` (shared) is the correct direction, and the reverse would be a violation. If another feature later needs the same layout, promoting `FormField` to `shared/ui` is a deliberate move, not a refactor forced by a wrong first placement. |
| Currency inputs | Plain text inputs with `inputMode="decimal"`, **not** `type="number"`. A fixed `₱` adornment is shown; the user does not type it. | `type="number"` accepts `e`, changes on scroll wheel, and gives locale-dependent values, and its `valueAsNumber` is a float. Text plus our own parser gives one deterministic rule set. |
| Reference No. when method is Cash | Hidden and excluded from the Review. The typed value stays in form state, so switching back to a bank does not lose it. | A cash payment has no transaction ID, so showing the field invites noise. Keeping the value respects "Back keeps data". |

## Steps and required fields

All text is trimmed before validation. Text fields are single-line: control characters
(including newlines) are rejected. The one exception is Notes, below. Everything is rendered as text by React; nothing is
ever inserted as HTML.

**Step 1 - Parties**

| Field | Required | Rule |
| --- | --- | --- |
| Issuer type | yes | Individual (default) or Organization. Changes the label only. |
| Issuer name | yes | 1-100 characters. Label is "Full name" or "Business name". |
| Recipient type | yes | Same toggle, defaulting to Individual, independent of the issuer's. |
| Recipient name | yes | 1-100 characters. |

**Step 2 - Items**

| Field | Required | Rule |
| --- | --- | --- |
| Items | yes | At least 1, at most 50. Add and remove. The last remaining item cannot be removed. |
| Item name | yes | 1-100 characters. |
| Quantity | yes | See "Number rules". |
| Unit price | yes | See "Number rules". |
| Item image | no | See "Item images and the storage budget". |
| Discount | no | Blank means 0. Number rules apply, except 0 is allowed. Must be less than or equal to the subtotal. |

Each item row shows its computed line subtotal. The step shows subtotal, discount, and
total, all formatted with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.
There is no VAT line.

**Step 3 - Payment**

| Field | Required | Rule |
| --- | --- | --- |
| Payment method | yes | One of: an institution from the 31-institution dataset (shown with its local logo), Cash, or Other. Searchable by name. |
| Other (specify) | only when method is Other | 1-50 characters. |
| Payment Reference No. | no | 0-40 characters. Not shown for Cash. Pasted values are trimmed. Never generated. |
| Receipt date | yes | A real calendar date, not in the future. |
| Notes | **no** | 0-300 characters and at most 5 lines, after CRLF is normalised to LF and the value trimmed. Newlines allowed, other control characters rejected. Empty is a normal outcome: it shows no error, no required marker, and never blocks Next. |

Why Review has no required fields: it has nothing to enter. It only shows the data and
lets the user go back.

## Number rules

These are the hostile-input rules. Each is a unit test on a pure parser, independent of
the UI.

- Input is trimmed. Empty is "required" (or 0 for discount).
- Accepted shape: digits with an optional decimal part. Commas are accepted only as
  correctly placed thousands separators (`1,234.50` yes, `1,23,4` no).
- A leading digit is required: `.5` is rejected, `0.5` is accepted.
- Rejected, each with a specific message: `abc`, `1e3`, `-5`, `+5`, `NaN`, `Infinity`,
  `1.2.3`, a currency symbol, internal spaces, non-ASCII digits.
- **Unit price**: 0.01 to 999,999.99, at most 2 decimal places. `0` and `0.00` are
  rejected. A third decimal place is rejected with a message, never rounded away.
- **Quantity**: 0.001 to 9,999.999, at most 3 decimal places (so `1.5` hours works).
  `0` is rejected.
- **Discount**: 0 to 999,999.99 and at most the subtotal. Same shape rules.
- Leading zeros (`007`) are accepted and normalised.
- The limits are chosen so the worst-case product, 9,999,999 thousandths times
  99,999,999 centavos, is about 1e15 and stays inside `Number.MAX_SAFE_INTEGER` (about
  9e15). Fifty such lines still fit after the divide by 1000. The tests include the
  maximum case to prove it.
- A zero-priced item is rejected deliberately: a free line on a proof of payment is noise,
  and the discount field covers the real need. Revisit if sellers ask for freebies.

## Item images and the storage budget

**The tension.** localStorage holds roughly 5 MB, counted differently per browser. One
phone photo can be several MB, and a data URL is about a third larger than the bytes.
The draft autosaves on every change, so a few photos could fill the quota and the write
could start failing in the middle of a session. A silent failure here would mean the user
believes their work is safe, closes the tab, and loses everything.

**Resolution: keep images in the draft, but make the budget impossible to overrun by
accident, and make any failure loud.** Three layers:

1. **Shrink before storing.** On attach, the file is decoded in the browser and redrawn
   to at most 800 px on its longest edge (never upscaled), honouring EXIF orientation,
   on a white background (so transparent PNGs do not turn black), and encoded as JPEG at
   quality 0.8. If the result exceeds **120 KB** it is re-encoded at lower quality
   (down to 0.5), then at 600 px. If it still exceeds 120 KB the image is rejected. A
   typical phone photo lands at 40-100 KB. The receipt is a phone-sized document, so
   800 px is already larger than it will display. The mission already commits to
   downscaling before embedding.
2. **Limit at the door, with a message.** Accepted types are JPEG, PNG, and WebP. Not
   SVG (can carry scripts and external references), not GIF, not HEIC (most browsers
   cannot decode it). A source file over **10 MB** is refused before decoding, so a huge
   file cannot exhaust memory. At most **10 images per receipt**, so worst case is about
   10 x 160 KB of base64, roughly 1.6 MB. The draft as a whole has a **2,000,000
   character** guard, well under the quota so other site data and the UTF-16 accounting
   differences between browsers do not matter. An attach that would cross the guard is
   refused at the moment of attaching, with the reason. The user hears "no" while they
   are looking at the thing they are attaching, not later at save time.
3. **If a write fails anyway, never fail silently and never destroy the last good draft.**
   `setItem` is wrapped. On a quota error or unavailable storage:
   - the previous saved draft is left untouched (a failed `setItem` does not overwrite it);
   - the save is retried **once without images**. If that succeeds, the status reads
     "Saved without photos. Photos are kept while this tab is open but will need to be
     re-attached if you reload.";
   - if that also fails, the status reads "Not saved. Your work will be lost if you close
     this page." and stays until a later save succeeds;
   - both messages are persistent inline status, announced to screen readers
     (`role="status"` for the first, `role="alert"` for the second), not only a toast that
     disappears.
   The form state in memory is never affected by a storage failure.

Rejected alternatives:

| Alternative | Why not |
| --- | --- |
| Exclude images from the draft entirely | Safest for the quota, but it means a reload silently drops every photo the user attached, which is the same loss we are trying to prevent, just guaranteed. Kept only as the fallback in layer 3. |
| IndexedDB for images | Handles megabytes properly. But it adds an async second store, two things to keep consistent, and a second thing to clear. With images shrunk to about 100 KB and capped at 10, localStorage is enough. Revisit if the cap proves too tight. |
| Store originals, downscale at export | Lets the quota overflow on the first photo. |
| Only cap the file size | A cap on the source says nothing about what is stored; a 4 MB JPEG and a 400 KB JPEG decode and re-encode to the same size. The stored size is what matters. |

Draft rules, beyond images:

- One key, `receipta:draft:v1`, holding the form values (parties and their types, items
  with images, discount, payment method, Other text, reference no., receipt date, and
  **Notes**), the current step, and the receipt number. Notes persists like every other
  value; it is text and costs the storage budget almost nothing. The `v1` is a schema version.
- Saves are debounced (about 500 ms) and also flushed on `visibilitychange` to hidden and
  `pagehide`, so closing the tab right after a keystroke still saves.
- A draft that fails to parse or validate is **ignored with a visible notice** ("A saved
  draft could not be read, so a new one was started"). It is not silently overwritten
  until the user's first edit. A draft in a newer schema version is treated the same.
- On restore, the step is the saved one, clamped back to the first step whose predecessors
  do not all validate.
- **Clear draft** is available on every step. It asks for confirmation (an alert dialog,
  since it is destructive), then removes the key, resets every value, issues a new Receipt
  No. and today's date, returns to step 1, and toasts "Draft cleared".
- Storage use must be disclosed. Today the Privacy Policy says "a single preference" is
  stored and the Cookie page says "Your receipts are not saved". Both become false the
  moment this ships. `stored_items` in `src/shared/config/legal.ts` and both pages must
  be corrected in the same change. A privacy promise that is wrong is worse than a
  missing feature.

## Reusable form primitives

The author asked for these explicitly. Fields are not hand-rolled in each step.

**Where they live, and why (Feature Sliced Design).** A slice may import from layers
below it and never the reverse.

| Component | Path | Layer |
| --- | --- | --- |
| `AppInput` | `src/shared/ui/app_input.tsx` | shared |
| `AppTextarea` | `src/shared/ui/app_textarea.tsx` | shared |
| `FormField` | `src/features/receipt_form/ui/form_field.tsx` | feature |

`FormField` importing `AppInput` goes feature to shared, which is allowed. `AppInput`
must never import from `features/`. `FormField` is feature-local because the label and
error layout is specific to this form, so `shared/ui` stays minimal. Promoting it to
`shared/ui` later is a deliberate move once a second feature needs it.

**`AppInput`**

- The project's own text input, **built on the shadcn input primitive** (added to
  `src/shared/ui/` in snake_case, imports fixed).
- It is the only place a single-line input's look is defined. Border, ring, placeholder,
  disabled, and invalid appearance all use tokens from `src/index.css`. No colour literal.
- Its focus-visible treatment matches the Button's, so keyboard focus looks the same
  across the app. A theme change is then a one-file change.
- Supports an optional leading adornment (the `₱`) and `inputMode`, so the money fields
  need no special input.
- Forwards a ref and passes through `id`, `name`, `value`, `onChange`, `onBlur`,
  `aria-*`, and the rest of the native input props.

**`AppTextarea`: the multi-line sibling.** Decision: a **separate component**, not a
textarea mode on `AppInput`.

- A mode would make `AppInput` render two different elements with two different prop
  types (`HTMLInputElement` and `HTMLTextAreaElement`), and its ref, handlers, and
  adornment would each need a union. A sibling keeps both honest and typed.
- **Theming still lives in one place.** The control look (border, ring, placeholder,
  disabled, invalid, and the focus-visible treatment) is one shared definition in
  `src/shared/ui/` that both `AppInput` and `AppTextarea` import. Changing the theme means
  editing that one definition. Neither component restates it, and a test asserts both
  use it.
- Built on the shadcn textarea primitive, snake_case. Forwards a ref and passes through
  native props including `rows` and `maxLength`. No adornment.

**`FormField`**

- Composes a **label**, a control (`AppInput` or `AppTextarea`), an optional hint, and the
  validation message, so every field in the wizard is laid out and labelled identically.
- **Works with TanStack Form, not beside it.** It takes the field api from TanStack
  Form's `form.Field` and reads value, change and blur handlers, and errors from it. No
  step keeps input state by hand. Errors show once the field is touched or the step's
  Next has been attempted.
- The label is associated with the control by `htmlFor` and a generated `id`
  (`useId`). **A placeholder is never the label.**
- When there is an error the control gets `aria-invalid="true"` and `aria-describedby`
  pointing at the message element's id; the hint, if any, is in the same
  `aria-describedby`. The message has an id and is rendered as text, not just colour.
- A required marker is shown in the label as text, not colour alone. Optional fields
  (Payment Reference No., Notes, Discount) show "Optional" as text.
- For Notes it shows a visible character count (for example "120 / 300"). The count is
  not a live region, so it does not chatter at a screen reader on every keystroke; the
  limit is stated once in the hint, which `aria-describedby` references.
- Components that are not text inputs (the Individual / Organization toggle, the payment
  picker, the image attach) follow the same label and error wiring. If they cannot use
  `AppInput` they still use `FormField`'s label and message parts.

## Accessibility

**Timeline**
- It is an ordered list (`<ol>`) of steps, so a screen reader announces "list, 4 items".
- The current step has `aria-current="step"`.
- Each step's state is **text a screen reader reads**, not only colour or an icon: a
  visually hidden "completed", "current", or "not yet reached" accompanies the name. The
  tick, number, and dot icons are `aria-hidden`.
- Completed steps are real `<button>`s. Current and upcoming steps are not buttons, so
  an upcoming step cannot be tabbed to and activated.

**Moving between steps**
- On every step change, focus moves to the step heading (`tabIndex={-1}`), and a polite
  live region announces "Step 2 of 4: Items". Focus is never left on a button that has
  just unmounted.
- When Next fails validation, focus moves to the first invalid field and its error is
  read via `aria-describedby`.
- Only the current step is in the DOM, so hidden steps add no tab stops and are not read.

**Keyboard**
- The whole wizard is operable without a mouse: every field, add and remove item, attach
  and remove image, payment picker, Back, Next, Clear draft with its dialog, and
  the timeline's completed steps.
- Enter in a single-line field triggers Next for that step. Enter on Add item, Remove,
  or any other button activates that button and does not submit.
- The payment picker is operable by keyboard: arrow keys move between options, typing
  filters them, Enter selects, Escape closes. Each option's logo has an empty `alt`
  because the name is beside it; the selected method's name is always in text.
- The image input has a visible, labelled trigger; the file chooser is reachable by
  keyboard. Removing an image returns focus to the attach control.
- Focus is always visible, 3:1 or better against its background in both themes, and is
  not clipped by an `overflow`.

## Layout and UI quality bar

The author asked for a good UI, not a functional one. These are checkable.

- The wizard uses the existing home-page spacing and type scale: `Section` for the
  container, the existing heading and body sizes, existing surface and shadow tokens.
  No new type size, spacing step, or colour is introduced. Colours remain in `index.css`.
- No horizontal scroll at 320px, 768px, or 1280px.
- At 1024px and up, the timeline is a vertical rail on the left, with the step content
  beside it.
- Below that, the timeline **collapses** to a compact horizontal strip above the form
  showing "Step 2 of 4 - Items" and a row of four segments. It remains a real list with
  the same state text, completed steps remain reachable, and the step names are never
  cut off to meaningless ellipses. It must be usable at 320px.
- Back and Next sit together at the bottom of the step. On narrow screens they are
  full-width and at least 44px tall. Back is absent on step 1, and Next on Review.
- Inputs are at least 44px tall on touch, with a font size of at least 16px so iOS
  Safari does not zoom on focus.
- Item rows reflow on narrow screens: name full width, quantity and price side by side,
  then image and remove. A long item name wraps rather than overflowing.
- The payment picker lists institutions with their logo at a fixed icon size and the
  name beside it, grouped e-wallets, digital banks, banks. Logos are served locally.
  A logo that fails to load leaves the name readable.
- Colours, shadows, and focus use the existing tokens in light and dark mode. The
  Review summary is UI, not the receipt, so it follows the app theme.
- Nothing uses arbitrary fixed dimensions (`w-[...]`, `h-[...]`, `size-[...]`) for
  non-icon elements. Fixed sizes are for icons and logos only. Maximum constraints
  (`max-w-*`) are allowed.
- Step changes may animate but follow the existing `Reveal` conventions and respect
  `prefers-reduced-motion`.

## Review step

The Review step is a **plain, themed summary for checking the data**. It is not the
receipt. It shows:

- Receipt No. (read-only) and Receipt date
- Issuer: name, and Individual / Organization
- Recipient: name, and Individual / Organization
- Each item: name, quantity, unit price, line subtotal, and a small thumbnail if there is one
- Subtotal, Discount (only if above 0), Total
- Payment method (name and logo; "Cash"; or the Other text), and the Payment Reference No. if present
- Notes, only if not empty, with line breaks preserved. An empty Notes shows no heading and no placeholder text.
- An **Edit** link per section that jumps back to its step
- A notice: "This is a receipt, not a BIR Official Receipt." (see below)

Why this and not more: the next spec decides what a receipt looks like. This step's job is
to let the user catch a wrong amount or misspelt name before they commit, so it must show
every field that will appear on the receipt, formatted the way it will be.

It has no export, download, or print button. A disabled button would suggest the feature
is nearly here; its absence is accurate.

## The BIR line

- The page, steps, labels, and Review use "receipt", never "Official Receipt", "OR",
  "invoice", or "BIR-registered". The Receipt No. is labelled "Receipt No.", never
  "Serial No.", "OR No.", or "Invoice No.".
- There is no field for TIN, VAT, business permit, or BIR registration, and none may be
  added to make it look more official.
- The Review notice above is visible without scrolling past the totals.

## Scope

### In scope

- `/create` page replaced; the placeholder removed
- Wizard shell, timeline, the four steps, Back and Next, Clear draft, and the optional Notes field
- `AppInput` and `AppTextarea` in `src/shared/ui/`, the shadcn input and textarea primitives they build on, and the feature-local `FormField` in `src/features/receipt_form/ui/`
- Money parsing, line subtotal, subtotal, discount, and total as pure functions, with unit tests
- Image downscale and the draft storage budget
- Draft save, restore, and clear
- Updating `stored_items` and the Privacy and Cookie pages to disclose the draft
- Tests for all of the above

### Out of scope

- **The designed receipt or invoice output.** The next spec.
- **PDF and image export**, and the export library. Phase 2.
- Percentage discount
- VAT, tax, or any tax field. Also TIN, address, contact person, or any extra party field.
- Multiple payment methods on one receipt, partial payments, or deposits
- Multi-currency
- Receipt history, multiple drafts, or a saved client list
- Pre-filling the issuer on a **new** receipt after a draft is cleared (that is roadmap
  Phase 3; the draft restores the issuer only for the receipt in progress)
- Issuer logo upload
- Editing the Receipt No.
- Accounts, sync, or anything that sends data off the device

## Acceptance criteria

**Steps and flow**

1. `/create` renders the wizard and `create_placeholder_page.tsx` is gone. Verified by a route test and by the file not existing.
2. There are four steps, in order: Parties, Items, Payment, Review. Only the current step's fields are in the DOM.
3. Next on a step with an invalid field does not advance, shows the error on each invalid field, and moves focus to the first one. Verified for each of steps 1-3.
4. Step 1 requires issuer name and recipient name. Both type toggles default to Individual. Selecting Organization changes the label from "Full name" to "Business name" and adds no field. Verified by a test counting inputs before and after.
5. Step 2 cannot advance with zero items; the only remaining item cannot be removed; adding a 51st item is refused with a message.
6. Step 3 requires a payment method, requires the Other text only when Other is selected, and requires a valid date.
7. Going Back from any step to any earlier step and Next again preserves every entered value, including images. Verified by a test that fills all steps, goes back to step 1, and checks every value.
8. Clicking a completed step in the timeline goes to it without validation. An upcoming step cannot be activated.

**Money and number rules**

9. Money functions are pure, in one module, with unit tests covering: a single item, many items, fractional quantity, a rounding case that lands exactly on a half centavo (rounds up), the maximum case (999,999.99 x 9,999.999) staying exact, a discount equal to the subtotal (total 0.00), and the classic `0.1 x 3` and `19.99 x 3` float traps.
10. Per-line rounding is verified: three lines whose individually-rounded values sum to a different figure than rounding the raw total once. The subtotal equals the sum of the displayed line subtotals.
11. The parser rejects each of the following with a distinct, readable message: empty, `abc`, `1e3`, `-5`, `+5`, `NaN`, `Infinity`, `.5`, `1.2.3`, `1,23,4`, `₱5`, `5 0`, `12.345` for price, `1.2345` for quantity, and `0` for price and quantity. It accepts `0.5`, `1,234.50`, `007`, and `1.5` for quantity.
12. Price above 999,999.99 and quantity above 9,999.999 are rejected. A discount above the subtotal is rejected and does not produce a negative total.
13. Every peso amount shown anywhere in the form is produced by the shared `Intl.NumberFormat('en-PH')` formatter, with two decimals. No hand-rolled formatting. Verified by search and by a test of `₱1,234.50`.
14. No VAT line or field exists anywhere in the form.

**Receipt number and date**

15. A fresh draft gets a Receipt No. matching `^REF-\d{8}-\d{6}$` in local time, with a unit test using a fixed clock around midnight and a single-digit month and day.
16. The Receipt No. does not change across step changes or reloads, is not an input, and changes only after Clear draft.
17. The date defaults to today in local time, accepts a past date, and rejects a future one. A test uses a fixed clock including a late-evening time that would differ from the UTC date.

**Items and images**

18. Attaching a JPEG, PNG, or WebP produces a stored image no larger than 120 KB and no longer than 800 px on its longest edge. A transparent PNG has a white background. A portrait phone photo is not rotated. The first two are unit-tested with a stubbed canvas; the third is verified in a browser with a real photo and recorded.
19. SVG, GIF, HEIC, a non-image renamed `.jpg`, and a file over 10 MB are each refused with a message naming the reason. An 11th image is refused with a message.
20. Removing an image clears it from form state and from the draft on the next save, and returns focus to the attach control.
21. An attach that would push the serialised draft past 2,000,000 characters is refused with a message at the time of attaching.

**Draft**

22. Editing a field writes `receipta:draft:v1` after the debounce, and reloading restores every field, the step, and the Receipt No. Verified by a test that unmounts and remounts.
23. A pending debounced save is flushed on `pagehide` and `visibilitychange`.
24. When `setItem` throws a quota error, the previous saved draft is unchanged, one retry is made without images, and the "Saved without photos" status is shown with `role="status"`. Verified with a stubbed `setItem`.
25. When the retry also throws, "Not saved" is shown with `role="alert"` and remains until a later save succeeds. Verified with a stub that throws always, then recovers.
26. When `localStorage` access itself throws, the form still works fully in memory and shows the "Not saved" state.
27. A corrupt, wrong-version, or schema-invalid stored draft shows the notice, starts empty, and does not throw. Verified for each of the three.
28. Clear draft is on every step, asks for confirmation, and on confirm removes the key, resets all values, issues a new Receipt No., returns to step 1, and toasts. Cancelling changes nothing.
29. `stored_items` in `legal.ts` lists the draft, and the Privacy and Cookie pages no longer say receipts are not saved. A test asserts the key `receipta:draft:v1` appears in `stored_items`.

**AppInput, AppTextarea and FormField**

30. `src/shared/ui/app_input.tsx` exports `AppInput`, built on the shadcn input primitive, which lives in `src/shared/ui/` in snake_case with working imports.
31. `AppInput` contains no colour literal; every colour is a token from `index.css`. Its focus-visible ring is the same treatment as `Button`'s, verified by a test comparing the class strings or the shared constant.
32. `src/features/receipt_form/ui/form_field.tsx` exports `FormField`, which takes TanStack Form's field api and renders the label, the control, an optional hint, and the error. `form_field.tsx` does not exist under `src/shared/`.
33. FSD direction holds: `form_field.tsx` imports `AppInput` and `AppTextarea` from `@/shared/ui/...`, and nothing in `src/shared/` imports from `src/features/`. Verified by search and by lint if the boundary rule is configured.
34. Every field in every step renders through `FormField`. Verified by a test and a search: no `<input` and no `<textarea` in any step or feature file outside `app_input.tsx` and `app_textarea.tsx`.
35. The label is bound by `htmlFor` and `id` (`getByLabelText` resolves each field in a test), and no field relies on a placeholder as its label.
36. An invalid field has `aria-invalid="true"` and `aria-describedby` resolving to an element containing the error text. A valid field has neither `aria-invalid="true"` nor a dangling `aria-describedby`.
37. Required fields show a text marker, not only colour. Optional fields show "Optional" as text.
38. No step holds input value state in `useState`; all values, validation, and errors come from the TanStack Form instance. Verified by a search for `useState` in step files showing none for field values.
39. `AppInput`, `AppTextarea`, and `FormField` each have their own test next to them, covering label association, error wiring, adornment (input), and ref forwarding.
40. `src/shared/ui/app_textarea.tsx` exports `AppTextarea`, built on the shadcn textarea primitive. `AppInput` and `AppTextarea` import one shared control-style definition, and a test asserts the same classes reach both, so a theme edit happens in one place.

**Notes**

41. Notes is on the Payment step, after the receipt date, and is the only multi-line field in the form. It is rendered through `FormField` with `AppTextarea`.
42. Next on the Payment step succeeds with Notes empty and with Notes containing only whitespace; neither shows an error, and whitespace is stored as empty.
43. Notes of exactly 300 characters is accepted; 301 is rejected with a message naming the limit. Six lines is rejected and five accepted. CRLF input is normalised to LF before counting. A control character such as a tab or NUL is rejected. Unit-tested on the validator.
44. A Notes value containing `<script>` or HTML renders as literal text on Review, with line breaks preserved.
45. Notes is saved in `receipta:draft:v1`, restored on reload, preserved through Back, and cleared by Clear draft. Verified by a test.
46. Notes appears on Review only when non-empty, and there is no empty heading or placeholder when it is.
47. The Notes count is visible, is not an `aria-live` region, and the limit is stated in the field's `aria-describedby` hint.

**Accessibility**

48. The timeline is an `<ol>` with four items; the current has `aria-current="step"`. Each item's state is exposed as text: `getByText(/completed|current|not yet reached/)` per item.
49. Completed timeline steps are buttons; current and upcoming steps are not.
50. On step change, focus is on the step heading and a polite live region reads "Step N of 4: <name>". Verified by tests checking `document.activeElement` and the region text.
51. The entire wizard can be completed with `userEvent.keyboard` only, in one test that goes Parties to Review without a pointer.
52. Enter in a text field advances the step; Enter on Add item adds an item and does not advance.
53. The payment picker supports arrow keys, typing to filter, Enter, and Escape, each tested.
54. Focus ring is visible in both themes at 3:1 or better and unclipped. Verified in a browser and recorded.

**Payment**

55. The picker lists all 31 institutions plus Cash and Other, each institution with its logo from its local `icon` path. Verified by a test comparing the options to `institutions`.
56. No network request is made for any logo: every `src` begins with `/`. Verified by a test.
57. Choosing Cash hides the Payment Reference No. and omits it from the Review; switching back shows the previously typed value.
58. The Reference No. accepts up to 40 characters and is never prefilled or generated.

**Review and the BIR line**

59. Review shows every field listed in the "Review step" section, formatted with the shared formatter, and Discount only when above 0.
60. Review's Edit link for each section goes to that step and Back returns with data intact.
61. Review has no export, download, or print control.
62. The Review notice states the receipt is not a BIR Official Receipt and is visible without scrolling past the totals at 320px.
63. No label, heading, or test id in the wizard says "Official Receipt", "OR No.", "Invoice No.", "Serial", "TIN", or "VAT". Verified by a text search over the rendered wizard at every step.

**UI quality bar**

64. At 320px, 768px, and 1280px, `document.documentElement.scrollWidth <= clientWidth` on every step, including Review with 50 items and a 100-character item name. Verified in a browser and recorded.
65. At 1024px and up the timeline is a left rail; below it, it is a compact strip showing "Step N of 4" and the current name, still a list with the same state text, and every completed step still reachable. Verified at 320px and 1280px and recorded.
66. At 320px, Back and Next are full width and at least 44px tall; every input is at least 44px tall with a computed font size of at least 16px.
67. The wizard uses the existing `Section` component, type scale, and surface tokens. A reviewer comparing to the home page finds no new font size, spacing step, or colour. Recorded with screenshots in light and dark mode.
68. No `w-[`, `h-[`, `size-[`, or fixed pixel width/height appears on a non-icon element in any new file. Verified by search.
69. Under `prefers-reduced-motion: reduce`, step changes have no movement. Verified in a browser with the preference emulated.
70. Contrast of text, helper text, error text, and placeholder measures 4.5:1 or better on the surface in light and dark mode, and the border of an input 3:1. Measured and recorded.

**Conventions and gate**

71. Files are snake_case, components PascalCase, hooks camelCase, type aliases over interfaces, no `any`, icons from `react-icons`, toasts from `react-hot-toast`, FSD layer imports respected (wizard, steps, and `FormField` in the `receipt_form` feature; `AppInput` and `AppTextarea` in `shared/ui`; nothing in `shared/` imports from `features/`).
72. `npm run build`, `npm run lint`, and `npm test` all exit 0.

## Deferred

Recorded so they are not mistaken for omissions.

- **The styled receipt.** The next spec, led by the author. This form only collects data.
- **PDF and image export**, including toasts for success and failure. Phase 2.
- **Re-issuing the Receipt No. at export.** The number is fixed at draft creation here;
  the export spec may decide a stale timestamp is wrong and regenerate it. If it does,
  the Review step's displayed number would change, which is a conscious cost to weigh.
- **Percentage discount.** Add only if sellers ask; it needs its own rounding rules.
- **Zero-priced items.** Rejected for now.
- **IndexedDB for images.** Revisit if the 10-image, 120 KB limits prove too tight.
- **Issuer pre-fill on a new receipt (Phase 3).** The draft restores the issuer for the
  receipt in progress only.
- **Promoting `FormField` to `shared/ui`.** Only when a second feature needs the same
  label-plus-error layout. A deliberate move, not a forced refactor.
- **Multiple drafts or receipt history.**
- **Per-field autosave status** ("saved 2 seconds ago"). One overall status is enough.
- **Drag-to-reorder items.**
- **Copy review** of labels and error messages by someone other than the implementer.
