# Timeline Active Step and Progress Colour - Requirements

## Goal

On `/create`, the sidebar step timeline (Parties, Items, Payment, Review) draws the
current step and the progress in `--primary`, a light lavender in dark mode,
`oklch(0.709 0.159 294)`. The logo mark and the dark-mode default button are a deeper
violet, `rgb(96, 49, 241)` (`--button`). The author's words: "i mean the sidebar timeline
only, no other change - the parties items payment and review, the active one change only
the color", then "and the progress", after asking for "the color of the logo and button
primary on dark mode".

So exactly two things take that violet: **the active step** and **the progress** (the
rail's line and the card header's bar). Light mode is unchanged: there `--button` aliases
`--primary`, so the colours are the same. This adds no element, copy or motion.

## The problem this spec resolves

The dark-button spec (2026-10-14) set the project's rule: **violet behind a label is a
fill and takes the mark violet; violet used as ink on the page stays lavender**, because
the mark violet is too dark to be seen as a line or shape.

Today the active disc is ink: an outline, a violet glyph, a halo. Moving that to the mark
violet fails the rule. The answer is to change the shape, not accept a miss: make the
active disc a **fill with a white glyph**, as the primary button is a violet fill with a
white label.

Calculated figures (dark), with the surface that matters. The active row is
`--surface-accent` `oklch(0.24 0.04 288)`, `rgb(30, 28, 49)`, not the page. Every
calculated value must be re-measured from the rendered page (criteria 2-4).

| Pair | Ratio | Basis |
| --- | --- | --- |
| White glyph on mark violet | 6.55:1 | measured, dark-button spec |
| Mark violet disc on the **active row** | **2.53:1** | calculated |
| Mark violet on the page / on the card | 2.92:1 / 2.69:1 | given / calculated |
| Lavender on the active row | 6.09:1 | calculated; today's rim, halo and edge marker |

**The filled disc is too close to its own row.** 2.53:1 is under 3:1, and a violet disc
on a lavender-tinted row is the weakest edge in the rail. The glyph passes comfortably, so
the disc is readable; its outline is not strong. The fix is decision 2.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| 1. Active disc | **Filled mark violet, white glyph. Dark only.** | The author wants the active step in the logo violet. As a fill the content is white on violet, 6.55:1, so the colour is correct by the project's rule and not an accepted miss. It reads as the primary button's twin, and makes the active step the most emphatic thing in the rail, which is the answer to "where am I". |
| 2. Active disc's edge | **The existing 2px `border-primary` rim and the `ring-primary/20` halo stay lavender.** | The disc's fill edge is 2.53:1 against its row. A lavender rim around the fill is ink on the row at 6.09:1, passes 3:1 and keeps the disc from disappearing. It is also zero new classes: these two are not edited. Recommended over a violet rim, which would put the 2.53:1 on the edge and still read as ink. The rim against the fill is measured and recorded. If the lavender ring looks wrong against the violet on a real display, the author decides; that is Deferred, not a reason to ship a violet rim now. |
| 3. Row's left edge marker and tint | **Unchanged.** | The edge marker is a 4px lavender bar at 6.09:1, passing. The tint is a surface and is what the violet is measured on. |
| 4. Progress line (2px) and overall bar (6px) | **Mark violet, in both themes via the token. A recorded exception to the ink rule.** | "And the progress" is the author's. The line is thin, so by the rule it is ink and would stay lavender. WCAG 1.4.11 asks 3:1 of a graphic needed to understand content, and these are not: each state they show is also carried by the disc (tick, filled, dashed), the sr-only "(completed)" / "(current)", and the card's "Step n of 4" text. They are non-interactive and bound no control. The cost, stated plainly: the line is about 2.7:1 on the card and the bar's fill-to-track is low, so both are fainter than lavender. The exception is narrow: **non-interactive progress fills whose state is duplicated in text and shape.** |
| 5. Completed discs and ticks | **Unchanged, lavender, with their current hover (`group-hover/step:bg-primary/85`).** | "no other change." |
| 6. The compact strip below 1024px | **Unchanged.** | "Sidebar" means the `lg` and up rail. The strip's segments keep `bg-primary`. |
| 7. The resulting mix | **Completed steps are lavender while the active step and the progress are mark violet.** | The author's instruction, not an oversight: "the active one change only the color" and "and the progress". Recorded so a reviewer does not "fix" it. Whether completed discs should match is a question for him; see Deferred. |
| 8. Focus ring | **Unchanged** (`focus-visible:ring-ring`). | Raised to 6.08:1 light / 6.50:1 dark to pass receipt-form criterion 54. Not a `primary` use. |
| 9. Light mode | **Unchanged.** The disc fill is added as `dark:` classes, leaving light's outline disc (`border-primary bg-card text-primary`) as it is. The line and bar swap `bg-primary` for `bg-brand-fill`, which in `:root` is `var(--primary)`. | An outline-to-fill change is structural and cannot ride on an alias, so it is `dark:` only. The line and bar are pure colour, so the alias carries them and light is identical by construction. |
| 10. Token | **A shared `--brand-fill` / `--brand-fill-foreground`, with `--button` and `--button-foreground` re-pointed at them.** | `--button` is named for a component, and the timeline consuming it makes the name false. The literal and its "a fill, never ink" comment move to `--brand-fill`, `--button*` alias it, and `button.tsx` is untouched. No `--brand-fill-hover` is added: nothing in this scope hovers (YAGNI). `--button-hover` keeps mixing from `--button`. The only edit outside `step_timeline.tsx` is `src/index.css`, where CLAUDE.md keeps colours, and it must be invisible to the button (criterion 6). The smaller alternative is the timeline consuming `--button` directly, at the cost of the name. |
| 11. "Number" | The active disc holds an icon glyph, not a number. | Recorded so nobody adds one. |

## Scope

### In scope

- `step_timeline.tsx`: the active disc's fill and glyph colour in dark; the progress
  line's fill and the card header bar's fill
- `src/index.css`: the two `--brand-fill*` tokens, their `@theme inline` mappings, and
  `--button*` re-pointed at them
- A test guarding those classes
- Measurement of every pair that changes, and the light-mode comparison

### Out of scope

- Completed discs, ticks and their hover
- The strip and its segments below 1024px
- The active step's rim, halo, edge marker and tint, which stay as they are
- The focus ring, and criterion 54's figures
- The upcoming state and labels
- `button.tsx`, the wizard, the steps, any other screen
- Dark `--primary`, `--ring`, `--surface-accent`; light mode

## Acceptance criteria

1. At 1280px in dark mode the active disc's background resolves to within one sRGB unit
   per channel of `rgb(96, 49, 241)` and its glyph to `rgb(255, 255, 255)`. The progress
   line fill and the card header bar fill resolve to the same violet. Read from the
   rendered elements, resolved through a canvas because Chrome reports `oklch()`, and
   recorded.
2. White glyph on the active disc fill measures 4.5:1 or better. Expected 6.55:1.
3. The active disc's fill against the active row's `--surface-accent` is measured, not
   assumed, and recorded. Expected 2.53:1. Beside it are the lavender rim against the row
   (expected 6.09:1) and the rim against the fill, so a reader can see what defines the
   disc's edge.
4. The line against the surface it sits on, and the line and the bar against their
   `--border` tracks, are measured from the rendered page and recorded. Any figure under
   3:1 is listed with decision 4's reasoning beside it.
5. The completed discs, ticks and hover, the strip segments, the active step's rim, halo
   and edge marker, and the row tint resolve to the same computed colours as on `main`
   in dark and light. Recorded.
6. `--button`, `--button-foreground` and `--button-hover` resolve to the same values as
   before in both themes, and `button.tsx` is not in the diff.
7. In light mode, the computed colours of the active disc (background, rim, glyph,
   halo), the line and the bar are identical before and after, read on `main` and on the
   branch. The light classes on the active disc are unchanged in the diff, and the
   `:root` `--brand-fill*` values are `var(--primary)` and `var(--primary-foreground)`.
8. `src/index.css` shows only the added `--brand-fill*` lines, their mappings, and
   `--button*` re-pointed. Dark `--primary`, `--ring` and `--surface-accent` are not
   edited.
9. Criterion 54 does not regress: the focus indicator on completed-step buttons still
   measures 6.08:1 light and 6.50:1 dark, re-measured from rendered pixels with keyboard
   focus, and the focus classes are unchanged in the diff.
10. Criterion 70's control borders do not regress: an input and the picker trigger
    measure 3:1 or better in both themes. They use a token this change does not touch, so
    this is a regression check.
11. A test asserts the active disc has the dark `brand-fill` classes alongside its
    unchanged light classes, that the line and bar use `bg-brand-fill`, and that the
    completed disc, the strip and the active rim still use `primary`. The existing
    timeline tests, including the sr-only state text, pass unedited.
12. No colour literal outside `src/index.css`, no `any`, no new dependency, snake_case
    files, no horizontal scroll at 320px in either theme (regression check).
13. `npm run build`, `npm run lint`, `npm test` all exit 0.

## Deferred

- **Completed discs matching the active step and progress.** They are lavender by the
  author's instruction. If he wants them to match, it is a fill behind a tick, which the
  rule allows at 6.55:1, but it is a separate change and he has said no other change.
- **A violet rim, or no lavender rim, on the active disc.** Only if the lavender ring
  looks wrong beside the violet fill on real hardware. A violet rim would leave the disc's
  edge at 2.53:1.
- **Lifting the progress line above 3:1** (lighter violet, wider line, brighter track).
- **The strip below 1024px** matching the rail.
- **Other violet fills** (badges, chips) should use `--brand-fill`.


## Amendment after measurement

The spec required the progress line and card header bar to take the mark violet. They
were built that way, measured, and **reverted to `--primary` on the author's decision.**

The figure that settled it: the violet fill separated from its own empty track at
**1.89:1** in dark, against about 4.5:1 for lavender. Both are dark colours, so the filled
and empty halves of the bar stopped being distinguishable. Nothing failed a criterion -
the bar is `aria-hidden` and the step count is stated as text beside it - but a gauge that
cannot show its own boundary is not doing its job.

**Only the active step's disc takes the mark violet**, as a fill with white content, where
it is legible and where it carries meaning. The criteria covering the progress line and
bar are superseded by this amendment; the criteria covering the active disc stand.

This is recorded rather than quietly edited because the spec was not wrong to ask - the
request was explicit - and the measurement is what changed the answer.
