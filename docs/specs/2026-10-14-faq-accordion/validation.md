# FAQ Accordion — Validation

Everything below marked "measured" was read from the rendered page: production build
(`npm run build`, `vite preview`), Chromium via Playwright, computed styles, the
Web Animations API and the Chromium accessibility tree. No row rests on a source grep
alone, except the ones labelled "grep".

Result: **21 of 23 criteria pass, 2 fail, 0 unverifiable.** Neither failure is a
rendering defect. One is a copy change that slipped in, the other is a spec sentence the
primitive does not satisfy. Both are for the author to decide.

## Gate 0 — Commands

| Check | Command | Result |
| --- | --- | --- |
| Build | `npm run build` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Tests | `npm test` | exit 0, 13 tests in `home_faq.test.tsx` pass |
| Keyframes emitted | `grep -l accordion-reveal dist/assets/*.css` | `index-*.css` |

Tests can fail (mutation run, product code restored afterwards):

| Mutation | Result |
| --- | --- |
| `type="multiple"` (with array `defaultValue`) | "closes the open item when another opens" fails |
| drop `collapsible` | "lets the open item be closed" and "toggles with Enter and Space" fail |

A bare `type="multiple"` with the string `defaultValue` left in place made only the
"close" test fail and the single-open test pass. That is a malformed mutation, not a
hole: with a valid array it is caught.

## Acceptance criteria

| # | Result | Evidence |
| --- | --- | --- |
| 1 | **FAIL** | Order and text match the source data, but the source data itself changed. See Defect 1. |
| 2 | pass | Six `heading[level=3] > button` in the accessibility tree; unit test. |
| 3 | pass | Load state `expanded` = `t f f f f f` (browser) and in the unit test. |
| 4 | pass | Opening item 2 flips item 0 to false; one `true` at a time. |
| 5 | pass | Clicking the open item leaves `ffffff`. |
| 6 | **FAIL as written** | Open button: `aria-controls` resolves, region has `aria-labelledby` back to it. The five closed buttons have **no** `aria-controls` at all. See Defect 2. |
| 7 | pass | See "Criterion 7" below. |
| 8 | pass | Real browser: Enter and Space toggle; ArrowDown, ArrowUp, Home, End move focus; ArrowUp from first wraps to last. Plus userEvent tests. |
| 9 | pass | `document.activeElement` unchanged after Enter, Space and click, in browser and in tests. |
| 10 | pass | Icon wrapper is `aria-hidden="true"`; no icon in the AX tree. |
| 11 | pass | Inset 2px ring, `:focus-visible` true, button box equals item box so nothing clips it. Light `oklch(0.526 0.247 287)` 5.38:1, dark `oklch(0.709 0.159 294)` 6.68:1 against the section. Screenshots inspected, both themes. |
| 12 | pass | See layout table. |
| 13 | pass | At 320 "Can I use it for my small business?" wraps to two lines (88px); icon stays 20x20 at x=272..292, inside 320, 22px below the top. |
| 14 | pass | Every button 64px at 320 (88 for the wrapped one). Minimum is 44. |
| 15 | pass | See "Animation". |
| 16 | pass, with a caveat | See "Reduced motion". |
| 17 | pass | grep: no `delay=` in `home_faq.tsx`; two `<Reveal>` (heading, accordion). |
| 18 | pass | `scrollY` 2245 before, after open, after close, after open another. |
| 19 | pass | See contrast table. Measured on the section surface, since there is no card. |
| 20 | pass | grep: no `useState` or `aria-` in the widget; Radix `Accordion` primitive; no `transition-all`, no `from "cn"`. |
| 21 | pass | grep: no colour literal, no `any` in the touched files; icons from `react-icons/lu`. `lucide-react` is not imported in `accordion.tsx`. |
| 22 | pass | BIR answer byte-identical to `HEAD~` and still says "not a tax document". |
| 23 | pass | Gate 0. |

## Layout (measured, real reflow at each width)

| Width | scrollWidth / clientWidth | Items | Item width | Item left edges | Console errors |
| --- | --- | --- | --- | --- | --- |
| 320 | 320 / 320 | 6, stacked | 288 | 16 | none |
| 375 | 375 / 375 | 6, stacked | 343 | 16 | none |
| 768 | 768 / 768 | 6, stacked | 720 | 24 | none |
| 1024 | 1024 / 1024 | 6, stacked | 768 | 128 | none |
| 1280 | 1280 / 1280 | 6, stacked | 768 | 256 | none |

768 was the builder's unsampled gap: one column, 720px wide in a 768px viewport, 64px
rows, icon right edge at 732, no overflow. Max width 768px (`max-w-3xl`) holds above it.

Elements with a right edge past the viewport exist at every width: the logo marquee
(`animate-[marquee…]`). It sits in a clipped container, `scrollWidth` equals
`clientWidth`, and it predates this feature. Not an FAQ finding.

## Animation (measured from the rendered panel)

Read from `getAnimations()` on the opening and closing panels during a real click:

| Property | Opening | Closing |
| --- | --- | --- |
| animation name | `accordion-reveal` | `accordion-conceal` |
| duration | 200ms | 200ms |
| delay / endDelay | 0 / 0 | 0 / 0 |
| timing function (computed) | `cubic-bezier(0.23, 1, 0.32, 1)` | same |
| animated properties | `height`, `opacity` | `height`, `opacity` |
| keyframes | 0px / 0 to 60px / 1 | 60px / 1 to 0px / 0 |
| iterations | 1 | 1 |

Frame samples while opening one item and closing another: opening height 0, 36, 53, 58,
60 at t = 10, 43, 76, 109, 143ms; opacity 0, 0.60, 0.88, 0.97, 0.99. The closing panel
mirrors it and reaches 0 height at about 143ms. Front-loaded, which is what ease-out
should look like. No spring, bounce, overshoot or stagger: both panels start in the same
frame. The closing panel gets `hidden` and its children are unmounted between 211 and
243ms, after the 200ms animation ends.

The icon crossfade is `transition-opacity` 200ms, same curve, plus a quarter-turn
transform when motion is allowed. Computed: `opacity, transform`, 0.2s,
`cubic-bezier(0.23, 1, 0.32, 1)`.

## Reduced motion (emulated `prefers-reduced-motion: reduce`, matched true)

| Check | Measured |
| --- | --- |
| Panel animation after click | `animation-name: none`, `getAnimations()` = 0 on both panels |
| Panel state on the first frame after click | open: height 60, not hidden, answer mounted. Closed: `hidden`, 0 children, text empty |
| Icon transform | `none` on both glyphs in every state; the rotation is gone |
| Icon state, settled | collapsed: plus 1, minus 0. Expanded: plus 0, minus 1. Unambiguous. |
| Both glyphs ever invisible together | no. Opacity samples (plus, minus) at 0/50/99/150/200/249ms: 1/0, 0.40/0.60, 0.07/0.93, 0.01/0.99, 0/1, 0/1. They always sum to 1. |

**Caveat, which is the answer to "does the icon still animate".** It does, a little. The
plus and minus still crossfade over 200ms under reduce: `transition-opacity` is not gated
behind `motion-safe:` (computed `transition-property: opacity`, 0.2s, two opacity
transitions running). Only the rotation is removed. Criterion 16 and the requirements
("a short fade is kept") allow that, and it matches `Reveal`. If the author reads "does
not animate" strictly, the fix is to put the opacity transition behind `motion-safe:` as
well. The state would then flip in one frame and still be unambiguous, since the end
values are the same. Not changed; it is a design call.

The panel is the strict part and it holds: no animation, no height change, no waiting.

## Criterion 7: does a collapsed answer's text stay out of reach?

**Yes. The builder's claim holds, and it holds for a different reason than the plan gave.**

Plan assumption, recorded as false: Radix does not unmount the closed panel. All six
`div[role=region]` exist in the DOM at all times, and a closed one is `hidden` with
**zero children**. The answer text is unmounted; the empty shell stays. The plan's test
wording (`queryByRole('region', { name })` is null) happened to pass anyway, because a
`hidden` region is excluded from role queries.

Measured in Chromium, on load, then after opening item 2:

| Probe | Result |
| --- | --- |
| Regions in DOM | 6 both times |
| Closed regions | `hidden = true`, `childElementCount = 0`, `textContent = ""` |
| Regions in the full AX tree (`Accessibility.getFullAXTree`, ignored included) | 1, the open one. Hidden regions are not in the tree at all. |
| Non-ignored `region` nodes | exactly one, named for the open question |
| Closed answer text found in the AX tree | none. On load only "free" matched. After opening item 2 only "data" matched. |
| Closed answer text found in `#faq` `textContent` | none (only the open answer) |
| Focusable elements inside any region | 0 |
| Tab order | six question buttons in order, no stop in a panel |

So the answer is gone from the DOM text, from the accessibility tree, and from the tab
order. The empty hidden shells are not exposed. The criterion's own test ("absent or not
visible, and not in the accessibility tree") passes on all counts.

What this does mean: the plan's claim "Radix unmounts the panel" and the unit test's
comment that absence is the true state are slightly wrong. What is absent is the
content, not the element.

## Accessibility tree (programmatic screen-reader pass)

Verified in the browser's accessibility tree, not by a real screen reader:

- Accessible names: each button is named exactly by its question; each open region is named by its question.
- Structure: `heading[level=3]` containing `button`, six times, under the `h2` "Questions, answered".
- `aria-expanded`: `true` on the one open button, absent-or-false on the rest in the snapshot; flips on every toggle, in both directions.
- `aria-controls`: present and resolving on the open button only. See Defect 2.
- `aria-labelledby`: every region, open or closed, points back at its button.

**Not verified: a real screen reader.** Whether VoiceOver announces "button, collapsed",
then "expanded" after activation, then reaches the answer once and does not read it
twice, needs a person with VoiceOver, NVDA or JAWS. The tree is correct, which is
necessary and not sufficient. The wording of the announcement, the behaviour of the
`region` landmark when it appears and disappears (six landmarks is the guidance limit, as
the plan noted), and focus behaviour on iOS and Android screen readers are all unchecked.

## Author's explicit asks (measured, they override the spec)

| Ask | Measured | Result |
| --- | --- | --- |
| 200ms, ease-out, no delay | 200ms, `cubic-bezier(0.23, 1, 0.32, 1)`, delay 0, endDelay 0 | pass |
| No spring, bounce, stagger | Both panels start in the same frame; one curve, no overshoot in samples | pass |
| No per-item background | Item and button `background-color: rgba(0,0,0,0)`; section is `oklch(0.96 0.022 292)` light, `oklch(0.2 0.025 280)` dark | pass |
| No shadow | Item and button `box-shadow: none` (the only shadow on the button is the focus ring, inset) | pass |
| `bg-card` absent | grep: no `bg-card` or `shadow` class in either file | pass |
| Hairline borders | Item `border-bottom` 1px solid `--border`; root `border-top` 1px | pass |
| Plus when collapsed, minus when open | Screenshots, both themes, and computed opacity: collapsed plus 1 / minus 0, open plus 0 / minus 1 | pass |

Requirements that the author's asks supersede: criterion 15 and "Decisions" say chevron and
card surface; the build has plus/minus and no card. Contrast and hover were therefore
measured against the section surface.

## Contrast (computed from the rendered colours, measured against the section background)

| Foreground | Light | Dark | Minimum |
| --- | --- | --- | --- |
| Question `--foreground` | 12.98:1 | 16.56:1 | 4.5 |
| Answer `--muted-foreground` | 4.87:1 | 7.31:1 | 4.5 |
| Icon `--muted-foreground` | 4.87:1 | 7.31:1 | 3.0 |
| Hover, question and icon `--primary` (hover media matched) | 5.38:1 | 6.68:1 | 4.5 / 3.0 |
| Focus ring | 5.38:1 | 6.68:1 | 3.0 |

Section background read as rgb 242,239,255 (light) and 20,21,33 (dark). Light-mode answer
text at 4.87 is the tightest pair, 0.37 above the line.

Hover has no surface change, by the author's request; the question and icon turn to the
primary colour. The `[@media(hover:hover)]` gate matched here. On a touch device with no
hover the colour change never fires, which is intended.

## Defects

**1. Copy changed: "Your customers names" became "Your customers' names".** The
data answer in `questions.ts` now carries a typographic apostrophe. The plan said move
the strings byte for byte and leave the typo alone as a separate copy change; criterion 1
says "unchanged text"; the requirements call copy out of scope. It is a visible
correction and probably welcome, but it is not what was specified. **The test suite cannot
see it:** criterion 1's test compares the rendered text against `questions.ts`, which is
the edited file, so any edit passes. The only reference is git history. The author
decides: keep it (and amend the spec) or restore the original string. Not touched here.

**2. Closed buttons carry no `aria-controls`.** Radix sets it only while the panel is
mounted. Criterion 6 says each button's `aria-controls` resolves, which is false for five
of six at any moment. This is arguably correct behaviour, since an `aria-controls` that
points at nothing is itself an ARIA error, and the closed region has no id to point at.
So the likely fix is to the criterion, not the code. The unit test only checks open
items (indices 0 and 2) and so passes. Counted as a fail because the sentence as written
is not true. Author to rule.

No other defect found. Specifically not found: layout overflow at any width, console
errors, scroll jump, clipped ring, unreachable closed text, both-or-neither icon state.

## Not run

- A real screen reader pass (VoiceOver, NVDA, JAWS, TalkBack). See above.
- Touch hit-testing on a real device. Heights were measured; taps were not.
- Hostile content (very long unbroken words, emoji, non-Latin). The six answers are fixed
  copy and there is no user input, so the `break-ui` pass was not run.
- Safari and Firefox. Chromium only. `getAnimations`-timed values are from Chromium.
- Frame-rate or jank profiling of the height animation, and the two-heights-at-once
  moment the plan flagged. Visually inspected frame samples only; no trace.
- The light/dark toggle was a `.dark` class on `<html>`, since the app has no toggle.

## Resolution of the two failures

Both failures were the spec being wrong about the implementation, not the implementation
being wrong. Neither was fixed in code.

**Criterion 1, the copy change.** The apostrophe fix was instructed by the author during
the build, after the spec was written. `Your customers names` was a typo, and the privacy
page already had `customers&rsquo; names`. Fixing it is a defect fix, not a copy change.
Criterion 1 now records the one authorised edit and still forbids any other wording change.

**Criterion 6, `aria-controls` on collapsed buttons.** Radix sets `aria-controls` only
while a panel is open. The criterion asked for it on all six buttons, which would mean
pointing at a hidden element - worse ARIA than omitting it. The criterion was reworded to
match correct behaviour. No code changed.

**Icon crossfade under reduced motion, left as built.** The 200ms opacity transition on
the plus and minus is not gated behind `motion-safe:`, so it still fades when movement is
reduced. The rotation is gated and does not run. This is deliberate: the preference asks
for less motion, not less feedback, and an opacity change is not movement. Verified that
the two opacities always sum to 1 during the fade, so the control never shows both glyphs
or neither.
