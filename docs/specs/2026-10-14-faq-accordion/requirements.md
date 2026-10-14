# FAQ Accordion - Requirements

## Goal

The home page FAQ shows six questions and six answers at once, in a two-column grid of
cards. That is a wall of text for a reader who wants one answer, and the two-column
layout makes the questions hard to scan. Convert it to an accordion: one question per
row, full width, answer hidden until the question is chosen, opening and closing with a
short animation. The reader sees six scannable questions and reads only the ones they
care about.

This is a presentation change. The questions, the answers, and what they say about BIR
official receipts do not change.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Open behaviour | **Single-open.** Opening one item closes the open one. | Six short items. With multi-open, a reader who opens three ends up with the same wall of text the accordion exists to remove, and the page keeps jumping as heights change. Single-open also keeps the section's height predictable. The cost: a reader cannot compare two answers side by side. With six one-paragraph answers that is not a real need. |
| Collapsible | The open item can be closed again by activating it. | A single-open accordion that cannot be fully closed traps the reader in a state with no way back to the plain list. |
| Default state | **First item ("Is it really free?") open on load.** | An all-collapsed FAQ shows only questions, so the section looks empty and the reader must discover that rows are interactive. One open item demonstrates the pattern and delivers an answer with zero clicks. First is chosen because it is the first thing a reader wonders. |
| Which item is open by default | Not the BIR item. | Opening the BIR item by default is tempting for safety. It is not needed: the same limit is stated elsewhere on the page and in the footer. Forcing it open would make the section look like a disclaimer, and a reader who does click it gets the same plain answer. |
| `Reveal` | **One `Reveal` around the whole accordion, no per-item stagger.** | The 50ms stagger worked for a grid of cards arriving as a group. As full-width rows stacked tightly, a cascade reads as a slow list render and delays the content. The heading keeps its own `Reveal`. Per-item `Reveal` would also wrap each row in a `motion.div`, which sits between the accordion root and its items. |
| Animation | Height and opacity of the answer, ease-out, 200-300ms. A chevron rotates to show state. | Height is what reveals content; the chevron gives a second, non-motion state cue. Ease-out matches the project's existing curve. Longer than 300ms makes a repeat visitor wait. |
| Reduced motion | Under `prefers-reduced-motion: reduce`, the answer appears and disappears **without height animation** and the chevron does not rotate through a transition. State still changes immediately and visibly. | The preference removes movement, not feedback. Matches `Reveal`, which drops the translate and keeps a short fade. |
| Copy | **Out of scope.** The six questions and answers are unchanged, word for word, and keep their order. | A layout change should not carry a copy change: it makes the diff unreviewable and the BIR answer is deliberately plain. Any copy edit is its own change. |
| Component | Use the shadcn/ui Accordion primitive, not a hand-built one. | Project rule: compose shadcn primitives. It is built on Radix, which supplies the keyboard behaviour and ARIA state below, the part most likely to go wrong when hand-rolled. How it is added is a plan-level matter. |
| Surface | Each row is a card on the existing `bg-surface-tint` section, using the existing shadow and surface tokens. | The light-mode refresh settled these tokens. No new colour is introduced. |

## Accessibility

An accordion built from plain `div`s is the classic failure: not operable from the
keyboard and silent about its state. The requirements below are concrete so each can be
tested.

**Structure**
- Each question is a **real `<button>`**, inside a heading element, so a screen reader
  user can navigate the questions by heading and operate them as buttons.
- The button is the only interactive element in the row. The whole question row is the
  hit target, not just the text or chevron.
- The button carries `aria-expanded="true"` when its answer is shown and `"false"` when
  hidden. A screen reader announces "expanded" or "collapsed" on focus and on toggle.
- The button has `aria-controls` pointing at its answer panel's id. The panel has
  `role="region"` and `aria-labelledby` pointing at the button, so the panel is named by
  its question.
- A collapsed answer is **not reachable**: it is not in the accessibility tree and its
  content is not tabbable or readable. Hiding by height or opacity alone does not meet
  this.
- The chevron is decorative and hidden from assistive technology (`aria-hidden`).
  State is conveyed by `aria-expanded`, never by the icon alone.

**Keyboard**
- Tab moves focus to each question button in order. Answer panels contain no focusable
  elements, so they add no tab stops.
- Enter and Space toggle the focused item.
- Down Arrow, Up Arrow, Home and End move focus between question buttons. This is the
  WAI-ARIA accordion pattern, which is optional there but is provided by the primitive,
  so it is required here.
- Focus stays on the button after toggling. It must not jump into the panel or be lost.
- A visible focus ring is present on the button and meets 3:1 against its background in
  both light and dark mode. It is not clipped by the row's `overflow`.

**Screen reader outcome.** On focusing a collapsed item, the reader hears the question,
"button", and "collapsed". After activating it, the reader hears "expanded", and the
answer is reachable immediately by moving forward. The answer is not announced a second
time unprompted.

**Contrast.** Question text, answer text, and the chevron measure 4.5:1 or better
(the chevron 3:1) against the card surface in both themes, re-measured because the row
now carries a hover state.

## Layout

- One item per row, full width of the existing `max-w-3xl` container, at every viewport.
  The `sm:grid-cols-2` grid is removed.
- Rows are separated by a gap, each its own card, so the open row visibly lifts from its
  neighbours.
- No horizontal scroll at 320px. A long question wraps; the chevron stays aligned to the
  first line and is not pushed off-screen or squashed.
- Pointer rows show a hover state. Touch targets are at least 44px tall.
- Opening or closing an item must not make the browser scroll the page.

## Scope

### In scope

- `src/widgets/home_faq/ui/home_faq.tsx`: restructured as an accordion
- Adding the shadcn Accordion primitive to the shared UI, named in snake_case per
  project rules
- The open/close animation and its reduced-motion behaviour
- Tests for the behaviour above
- Removing the per-item `Reveal` stagger

### Out of scope

- **Question and answer copy.** Unchanged, including the BIR answer.
- Adding, removing, or reordering questions
- Deep links to a single question, or syncing the open item to the URL hash
- Search or filtering of questions
- The section heading, subheading, background, and spacing
- Dark mode palette changes. The accordion uses existing tokens.
- Analytics on which question is opened. Receipta has no backend and tracks nothing.
- Moving the FAQ to a separate route

## Acceptance criteria

1. The FAQ renders six question rows in the original order, verified by a test that compares rendered question and answer text against the source data. One copy change is authorised by the author: `customers names` becomes `customers’ names`, fixing a missing apostrophe so it matches the privacy page. No other wording changes.
2. Each question is a `<button>` inside a heading element, verified by a test querying `getByRole('button', { name: <question> })` for all six.
3. On load the first item's button has `aria-expanded="true"` and the other five have `aria-expanded="false"`.
4. Clicking a collapsed item sets its `aria-expanded` to `true` and sets the previously open item's to `false`. At most one is `true` at any time.
5. Clicking the open item sets its `aria-expanded` to `false`, leaving none open.
6. While an item is open, its button's `aria-controls` resolves to an element with `role="region"` whose `aria-labelledby` points back to that button. A collapsed button may omit `aria-controls`: Radix sets it only while the panel is open, and referencing a hidden element would be worse than omitting it.
7. A collapsed item's answer is not exposed: `getByText(<answer>)` is absent or `not.toBeVisible()`, and the answer is not in the accessibility tree.
8. Enter and Space on a focused button toggle it. Down/Up Arrow, Home and End move focus between question buttons. Each is covered by a test using `userEvent`.
9. After toggling by keyboard, `document.activeElement` is still the same button.
10. The chevron has `aria-hidden="true"`; no state is conveyed by the icon alone.
11. A visible focus ring is present on keyboard focus in both themes and is not clipped. Verified in a browser and recorded.
12. At 320px, 768px and 1280px there is exactly one item per row, full container width, and `document.documentElement.scrollWidth <= clientWidth`. Verified in a browser and recorded.
13. The longest question wraps at 320px without pushing the chevron off-screen or shrinking it.
14. Each question button is at least 44px tall, measured at 320px.
15. Opening or closing an item animates the answer's height and opacity over 200-300ms using ease-out. Verified in a browser by recording the transition values.
16. Under `prefers-reduced-motion: reduce` the answer toggles with no height animation and the chevron has no rotation transition, while `aria-expanded` and visibility still change immediately. Verified in a browser with the preference emulated, and recorded.
17. The per-item `Reveal` stagger is gone: no `delay={index * 50}` remains in `home_faq.tsx`, and a single `Reveal` wraps the accordion.
18. Opening or closing an item does not change `window.scrollY` when the section is fully in view.
19. Text contrast on the card surface measures 4.5:1 or better in light and dark mode, including the hover state, and the chevron 3:1. Measured and recorded.
20. The accordion is built on the shadcn/ui Accordion primitive; no hand-written open/close state machine or ARIA wiring exists in `home_faq.tsx`. Any added shared file is snake_case and its imports resolve.
21. No new colour literal outside `src/index.css`, no `any`, and any icon comes from `react-icons` (`lucide-react` appears only inside the generated primitive).
22. The BIR answer text is unchanged and still reads that Receipta is not a BIR official receipt.
23. `npm run build`, `npm run lint`, `npm test` all exit 0.

## Deferred

Recorded so they are not mistaken for omissions.

- **Deep-linking to a question** (`/#faq-bir`). Useful if the BIR answer is ever linked
  from elsewhere, but nothing links to it today.
- **Multi-open mode.** Revisit only if the list grows past roughly ten items or answers
  get long enough that comparing them matters.
- **Copy review of the six answers.** Separate change.
