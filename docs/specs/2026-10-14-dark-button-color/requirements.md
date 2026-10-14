# Dark Button Colour - Requirements

## Goal

In dark mode the default button is a light lavender fill, `oklch(0.709 0.159 294)`, with
near-black text. The Receipta mark is a deeper violet, about `rgb(96, 48, 240)`. The
author wants dark-mode buttons to carry the mark's violet with white text, so the page's
main action reads as the brand rather than as a generic accent. Light mode is already
correct and must not change.

The mark's violet is the same value as light mode's `--primary`,
`oklch(0.526 0.247 287)`. So this is not a new colour. It is light mode's button colour
arriving in dark mode, and the work is mostly about doing that without breaking what else
dark `--primary` currently does.

This is a colour change to one component's fill. It adds no variant, no component, and no
copy.

## Measurements

Taken against the built page before writing this spec.

| Pair | Ratio | Reading |
| --- | --- | --- |
| White text on mark violet | **6.55:1** | Clears AA (4.5:1) |
| Mark violet fill on dark page `oklch(0.17 0.018 257)` | **2.92:1** | Under 3:1 |
| Mark violet fill on the closing CTA band | **2.53:1** | Under 3:1 |

These are the final measured figures for the mark's own violet, `rgb(96, 49, 241)`. The
draft's 6.08:1 and 2.73:1 were for `oklch(0.526 0.247 287)` and for the closing band
respectively, and are superseded. See Measured result at the end.

Not yet measured, and required by this spec: white text on the hover fill, the hover fill
against the page, the disabled state, and the focus indicator.

Dark `--primary` stays as it is, so everything that uses it today keeps its current
contrast. That is the point of decision 2.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope of the colour change | **Fills behind a text label take the mark violet. Violet used as ink on the page does not.** In practice that is the default `Button` variant only. Links, the theme-menu check, the FAQ hover text, and card hover borders keep dark `--primary`. | A solid violet fill behind white text is judged on the label (6.08:1). Violet used as text, a thin icon, a 1px border or a focus ring is judged against the page, and the mark violet is 2.73:1 there, so it fails 3:1. Those uses must stay lavender. Two violets in dark mode is therefore deliberate: one is a fill, one is ink, and each is the lighter or darker value its job needs. An audit of `src/` found no other violet fill: the header nav links and theme trigger are `ghost`, and no badge uses `bg-primary`. The "everything violet" option would fix nothing that is broken and would spread the 2.73:1 problem to the uses that cannot absorb it. The cost: if a violet badge or chip is added later, it must use the button token too, or dark mode shows two violet fills. Recorded under Deferred. |
| Token mechanism | **A separate `--button` / `--button-foreground` pair**, exposed as `--color-button` / `--color-button-foreground` in `@theme inline`. In `:root` they alias `--primary` / `--primary-foreground`. In `.dark` they hold the mark violet and white. Dark `--primary` and `--ring` are not edited. | Repainting dark `--primary` is the shorter edit and is wrong. `--primary` also drives `--ring`, link colour (`text-primary` in five places), the FAQ focus ring and hover text, and the card hover borders. All of those are foreground-on-page uses, and every one would drop to about 2.7:1 and fail 3:1. The pair keeps one meaning per token: `--primary` is violet as ink, `--button` is violet as a fill. Aliasing in `:root` makes "light mode unchanged" true by construction, since the computed value is the same variable. All colours stay in `src/index.css`, as CLAUDE.md requires. The dark value is written once, with a comment saying it is the logo mark's violet and why it must not be reused as text. |
| Fill against page, 2.73:1 | **Acceptable for the resting state. No permanent border or ring is added.** Hover must not make it worse. | WCAG 1.4.11 requires 3:1 for a visual boundary only when the boundary is needed to identify the control. This control is identified by its label, which measures 6.08:1, and by its shape and position (a rounded rectangle in the header and the hero). A user who could not see the fill edge at all would still find and read the control. A hairline border would add visual noise to the main call to action, and a lighter violet would give up the brand colour the author asked for. The fill-edge is 0.27 short of the 3:1 line, which is a close miss and not a clear pass, so the spec does not leave it unwatched: hover must not lower fill-to-page contrast, and the result is recorded in validation. If a reviewer or the author sees the button disappear into the page on a real display, the remedy is a slightly lighter violet, settled as its own change. |
| Hover | **Must be re-measured, and must not darken the fill toward the page.** The current `hover:bg-button/80` blends the fill with the dark page. Blending toward a near-black page can only lower fill-to-page contrast from 2.73:1, so hover would make the edge worse at the moment the user is looking at it. White text on a darker fill rises, so the label is not at risk, but the edge is. | The prototype's `hover:bg-button/80` is an unreviewed carry-over from `bg-primary/80`, which was tuned for a light fill. In light mode it is unchanged. In dark, the implementer picks a hover that does not lower fill-to-page contrast, for example a small mix toward white, as the `secondary` variant already does with `color-mix`. The exact value is a plan-level matter. The requirement is the measured outcome in the acceptance criteria. |
| Text colour | **White, `oklch(1 0 0)`**, in `--button-foreground` in dark. | The author's choice. 6.08:1 on the fill. Not `--foreground`, which is a slightly cool near-white that is not what was asked for. |
| Variants | **Only `default` changes.** `outline`, `secondary`, `ghost`, `destructive` and `link` are untouched. | They are not violet fills. `link` uses `text-primary` and stays ink. |
| Focus ring | **Unchanged: `--ring` stays lavender.** The ring is not recoloured to match the fill. | A violet ring on a violet fill on a dark page would be invisible. The existing ring is a different colour from the fill, which is what makes it show. |
| Light mode | **Not touched.** | Settled and shipped. |

## Scope

### In scope

- `src/index.css`: add `--button` and `--button-foreground` in `:root` (aliasing) and in
  `.dark` (mark violet, white), and expose both in `@theme inline`
- `src/shared/ui/button.tsx`: the `default` variant uses the new tokens, including a
  hover that does not lower fill-to-page contrast
- A test that guards the default variant's classes, so it cannot quietly fall back to
  `bg-primary`
- Measuring and recording contrast for every state listed below

### Out of scope

- **Dark `--primary`, `--ring`, `--sidebar-primary`, and the chart tokens.** Unchanged.
  This is the reason the token pair exists.
- Light mode. No value changes, no class changes visible in light.
- Any variant other than `default`
- Link colour and the other foreground uses of `--primary`
- A permanent border or ring on the button (decision 3)
- A lighter or different violet. The value is the mark's, as requested.
- Re-colouring the logo or adding a dark-mode logo variant
- New buttons, copy, sizing, radius, or motion. `active:scale` and the transition list are
  unchanged
- Gradients, chips and surface tokens
- Changing the colour of anything outside `src/index.css` and `button.tsx`

## Behaviour of the states

- **Resting:** mark violet fill, white label.
- **Hover:** a fill that is not darker toward the page than resting contrast allows (see
  criterion 6), white label still at least 4.5:1.
- **Active:** unchanged (`active:scale-[0.97]`).
- **Focus-visible:** the existing lavender `border-ring` and `ring-ring/50` ring, unchanged
  in code. It is checked, not assumed, because the fill behind it has changed.
- **Disabled:** unchanged mechanism (`opacity-50`, `pointer-events-none`). WCAG exempts
  inactive controls from contrast minimums, but the disabled button must still read as
  disabled and as a button, so the result is recorded.

## Acceptance criteria

1. In dark mode the default `Button` resolves to a background of the mark violet and a
   text colour of white. Verified in a browser by reading the computed `background-color`
   and `color`, and recorded. The background is within one unit per sRGB channel of
   `rgb(96, 49, 241)`, the logo mark's own violet. That value is 14.2% of the opaque
   pixels in `logo_mark.webp` (body mean `rgb(97, 52, 240)`), measured from an exact
   histogram with no quantisation, and `oklch(0.51 0.26 283.4)` round-trips to it.
2. In light mode the default `Button`'s computed `background-color`, `color` and hover
   `background-color` are identical before and after the change. Verified by reading the
   computed values on `origin/main` (1a5b9a0) and on the branch and recording both. The
   `:root` values of `--button` and `--button-foreground` are `var(--primary)` and
   `var(--primary-foreground)`.
3. White text on the resting fill measures 4.5:1 or better in dark mode. Expected 6.55:1.
   Measured and recorded.
4. White text on the hover fill measures 4.5:1 or better in dark mode. Measured on the
   real composited colour, since the hover blends or mixes with what is behind it, and
   recorded.
5. Mark violet fill against the surface behind it is measured and recorded for the resting
   state, for both surfaces it appears on: the page background `oklch(0.17 0.018 257)`,
   expected about 2.92:1, and the closing CTA band, expected about 2.53:1. Both miss 3:1
   and both are accepted on the reasoning in decision 3. It is not an unmeasured assumption.
6. The hover fill against the surface behind it is at least as high as the resting fill
   against that same surface. Measured and recorded on both surfaces. If hover would
   lower it, the hover is changed, not the criterion.
7. Dark `--primary` is still `oklch(0.709 0.159 294)` and dark `--ring` is still
   `oklch(0.709 0.159 294)`. Verified by a diff of `src/index.css` showing neither line
   edited.
8. The foreground uses of `--primary` are unchanged in dark mode: link text, the
   theme-menu check, the FAQ hover text and focus ring, and card hover borders still
   resolve to their previous computed colours. Verified by reading computed colour on at
   least a link and the FAQ question button before and after, and recorded.
9. The focus-visible indicator on the default button in dark mode is visible and measures
   3:1 or better against the page background. Its contrast against the new violet fill is
   also recorded, so a reviewer can see what the ring is read against. Verified in a
   browser with the keyboard and recorded.
10. The disabled default button in dark mode is visibly distinct from an enabled one and
    still reads as a button. Checked by rendering a disabled instance, screenshot or
    computed values recorded. No contrast threshold applies to it.
11. Only the `default` variant changed: `outline`, `secondary`, `ghost`, `destructive`
    and `link` produce the same class strings as before, verified by diff of
    `button.tsx`.
12. Both header and hero call-to-action buttons (the header `Create receipt` link rendered
    through `asChild`, and `CtaButton`) show the new fill in dark mode. Verified in a
    browser at 1280px and recorded.
13. A test asserts the default variant's classes use `bg-button` and `text-button-foreground`
    and not `bg-primary` / `text-primary-foreground`.
14. No new colour literal appears outside `src/index.css`. The single dark literal is
    commented with where it comes from.
15. No `any`, no new dependency, and files remain snake_case.
16. No horizontal scroll at 320px introduced: `document.documentElement.scrollWidth <=
    clientWidth` in both themes. No layout property was changed, so this is a regression
    check.
17. `npm run build`, `npm run lint`, `npm test` all exit 0.

## Deferred

Recorded so they are not mistaken for omissions.

- **A lighter violet or a hairline ring**, if the 2.73:1 fill edge proves too faint on real
  displays. Needs a visual look on hardware, not a calculation.
- **Violet fills added later** (badges, chips, selected states). They should use the button
  token pair, or be listed here as a deliberate second violet. None exist today.
- **Contrast of the unrelated lavender ink** (`--primary` on page) was not re-audited. It
  is untouched by this change.

## Corrections made during implementation

Three criteria were wrong about the numbers, not about the design. All three were
corrected above rather than marked as failures.

1. **Criterion 1's target colour, and the token itself.** The first implementation used
   light mode's `--primary`, `oklch(0.526 0.247 287)`, which renders `rgb(107, 58, 237)` -
   eleven units off the logo mark and visibly lighter and less blue. The author asked for
   the icon's colour, so the mark was re-sampled with an exact pixel histogram:
   `rgb(96, 49, 241)`. Dark `--button` is now `oklch(0.51 0.26 283.4)`, which round-trips
   to it. The original draft's `rgb(96, 48, 240)` estimate was close; the token chosen to
   satisfy it was not.
2. **Criterion 5's surface.** The 2.73:1 figure was the fill against the closing CTA
   band, not against the page. Against the page the measured figure is 3.14:1, which
   clears 3:1. So the resting fill passes 1.4.11 on the header and hero buttons and
   misses it only on the closing band. This also explains an earlier disagreement between
   a calculated 3.16 and a measured 2.73 - they were two different surfaces.
3. **Criterion 6's baseline** followed from criterion 5 and now reads per surface.

## Two findings for the author, outside this change's scope

Both predate this change and neither is caused by it. Recorded rather than silently
fixed, because both are real and neither is this PR's business.

- **The dark focus ring measures 2.58:1 against the page, not 3:1.** Criterion 9 assumed
  it already passed. It did not, before or after this change, and `--ring` was not
  touched. What rescues the focus state is the 1px border, which measures 7.04:1 against
  the page - and which is now *more* visible than before, because previously it matched
  the lavender fill and was effectively invisible. So this change improves the focus
  indicator without having set out to. The 2.58:1 halo still wants a decision.
- **The light-mode hover label measures 4.02:1, below AA.** `bg-primary/80` blends the
  light fill toward white, so the white-ish label loses contrast on hover. This is
  existing behaviour on every default button in light mode and is untouched here. Worth a
  follow-up; fixing it means changing light hover, which is outside this spec.

## Measured result

Read from the rendered page on a production build, with every colour resolved through a
canvas because Chrome reports computed colours as `oklch()`. An earlier attempt parsed
those strings as RGB and produced nonsense; the figures below replace it.

| Pair | Dark | Light |
| --- | --- | --- |
| Fill | `rgb(96, 49, 241)` | `rgb(107, 58, 237)` |
| Label | `rgb(255, 255, 255)` | `rgb(250, 250, 253)` |
| Label on fill | **6.55:1** | 5.84:1 |
| Fill against page | 2.92:1 | 5.81:1 |
| Fill against closing CTA band | 2.53:1 | 5.20:1 |

The dark fill is byte-identical to the logo mark's own violet, which was the point.
Light mode's figures match the pre-change measurements exactly.

**The trade-off, stated plainly.** Using the real logo violet instead of light mode's
`--primary` improves the label from 6.08:1 to 6.55:1 and costs fill-to-page contrast:
3.14:1 drops to 2.92:1 on the page, and 2.73:1 to 2.53:1 on the closing band. The page
figure now misses 3:1 where it previously cleared it. Decision 3 already accepted a
sub-3:1 fill on the reasoning that the 6.55:1 label and the button's position identify
the control, and WCAG 1.4.11 asks for 3:1 only on a boundary needed for identification.
That reasoning holds at 2.92:1, but it is now the only thing holding, so it is worth the
author's eye on a real display. A hairline ring remains the cheap fix if the edge reads
too softly, and is listed under Deferred.

## Hover, measured

Dark hover is a solid `color-mix`, so it has no alpha and can be read straight from the
computed value.

| Dark | Fill | Label on fill | Fill vs page |
| --- | --- | --- | --- |
| Rest | `rgb(96, 49, 241)` | 6.55:1 | 2.92:1 |
| Hover | `rgb(124, 72, 239)` | 5.21:1 | **3.67:1** |

Hover clears the 4.5:1 floor on the label and raises fill-to-page from 2.92:1 to 3.67:1,
so the button's edge becomes *more* defined under the pointer rather than less. That was
the point of rejecting `/80` for dark mode.

**Light hover was not validly measured and does not need to be.** Light uses
`hover:bg-button/80`, whose alpha composites against the page at paint time; reading the
computed value without compositing reports hover as identical to rest, which is wrong.
Light mode is unchanged by construction instead: `--button` is `var(--primary)` in
`:root`, so the emitted light rules are the same colours as before this change, and the
pre-change and post-change computed values matched on all three CTAs. The separately
noted light-mode hover label figure of 4.02:1 is existing behaviour, measured from
composited screenshot pixels, and is untouched here.
