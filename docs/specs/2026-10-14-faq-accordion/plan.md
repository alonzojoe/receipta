# FAQ Accordion - Implementation Plan

Branch `feature/faq-accordion`, already cut from `main`. PR targets `main`, titled with the
branch name. Review runs automatically on open. Commits happen only after the author has
reviewed the diff.

| Commit | Covers |
| --- | --- |
| `docs: add faq accordion spec` | `requirements.md` and this plan |
| `chore: add shadcn accordion primitive` | task 1 |
| `feat: turn the home faq into an accordion` | tasks 2-4 (keyframes, widget, tests) |
| `docs: record faq accordion validation` | task 5 |

Tasks 2-4 are one commit because the keyframes are dead CSS without the widget, and none of
the three is reviewable alone. Task 1 is its own commit because it is generated code with
hand fixes, and a reviewer should be able to read "what the CLI produced and what we
changed" without the feature mixed in.

## Architecture

```
src/
  index.css                          + accordion keyframes and --animate-* tokens (task 2)
  shared/ui/
    accordion.tsx                    NEW  generated, then fixed (task 1). One word, so
                                          no snake_case rename is needed.
  widgets/home_faq/
    index.ts                         unchanged
    model/
      questions.ts                   NEW  the Question type and the six entries, moved
                                          unchanged from the widget (task 3)
    ui/
      home_faq.tsx                   REWRITTEN (task 3): dl grid -> Accordion
      home_faq.test.tsx              NEW (task 4)
```

FSD check. The primitive is `shared/ui`, imported by a widget: downward, allowed. No page,
feature or entity is touched; `home_page.tsx` imports `HomeFaq` through the widget's
`index.ts` and does not change. No new dependency: `radix-ui` (the umbrella package that
already serves `dropdown_menu.tsx`) contains Accordion, and `tw-animate-css` and
`lucide-react` are installed.

## Task 1 - Add the shadcn Accordion and fix what the CLI breaks

Run `npx shadcn@latest add accordion`. This project has hit the same problems on every add,
so they are steps here, not surprises:

1. **`cn` import.** The generated file imports `cn` from the removed `cn` package. Change
   it to `import { cn } from "@/shared/lib/utils"`, matching `dropdown_menu.tsx`.
2. **`package.json`.** The CLI re-adds `cn` as a dependency. Remove it and run
   `npm install` so `package-lock.json` agrees. Check the diff of both files, and confirm
   the CLI did not add `@radix-ui/react-accordion` (this repo uses the umbrella
   `radix-ui` import) and did not rewrite `components.json` or `src/index.css`.
3. **`transition-all`.** The project forbids it (`code_reviewer` flags it). Grep the file.
   If present, replace it with the property actually being animated, for example
   `transition-[color,box-shadow]` on the trigger.
4. **Filename.** `accordion.tsx` needs no rename. Confirm the CLI did not emit a folder.
5. **`*Variants` export.** Check the exports. Accordion is expected to export only
   `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, with no `cva`, so
   no change to `eslint.config.js` is expected. `npm run lint` is the arbiter: if
   `react-refresh/only-export-components` fires on a `*Variants` export, add exactly that
   name to the `allowExportNames` array beside `buttonVariants` in the
   `src/shared/ui/**/*.tsx` override, and nothing else.

**Decision point - the chevron icon.** The generated trigger uses `lucide-react`, and the
radix-nova style may swap two icons (down and up) rather than rotate one. The requirements
want a single chevron that rotates, so a swap does not satisfy them. Options: (a) keep
lucide, which the rule permits inside generated primitives, and edit to one icon; (b)
replace it with a `react-icons` chevron. **Recommend (b):** the line is being edited
anyway, and it keeps `lucide-react` out of one more file. Either way the icon carries
`aria-hidden="true"` (criterion 10); confirm it, do not assume the generated file sets it.

**Verify.** `npm run build && npm run lint && npm test` exit 0.
`grep -n "transition-all" src/shared/ui/accordion.tsx` prints nothing.
`grep -nE "from ['\"]cn['\"]" src/shared/ui/accordion.tsx` prints nothing.
`git diff package.json` shows no `cn` line and no new dependency.

## Task 2 - The animation, and reduced motion

### Where the animation comes from

**Decision point.** Three sources:

| Source | Verdict |
| --- | --- |
| `tw-animate-css` built-ins `animate-accordion-down` / `-up` | Rejected. Installed and already wired to `--radix-accordion-content-height`, but they animate **height only**, default to the CSS keyword `ease-out` rather than the project's curve, and are fixed at 200ms. The requirements specify height **and opacity**. |
| Keyframes inside the generated `accordion.tsx` | Rejected. A later `shadcn add --overwrite` erases them, and the project keeps motion primitives in `index.css`. |
| **Keyframes in `src/index.css`, beside `marquee`** | **Recommended.** |

The third is where `marquee` lives and where the shared `--ease-out` token is defined, so
curve and keyframes sit together; it survives regenerating the primitive; and it leaves the
generated file with a class-name reference instead of motion logic.

In `index.css`:

- Two keyframes with names distinct from tw-animate's `accordion-down`/`accordion-up` so
  they cannot collide, for example `accordion-reveal` and `accordion-conceal`. Reveal runs
  `height: 0 -> var(--radix-accordion-content-height)` with `opacity: 0 -> 1`; conceal is
  the reverse.
- Two `--animate-*` tokens in `@theme inline`, **200ms** each, using the project's
  `var(--ease-out)`, with no delay. **Author decision: smooth and fast only.** The author
  target is 180-200ms; criterion 15 says 200-300ms. The overlap is exactly 200ms, so that
  is the value, and it is not to be raised toward 300ms. No spring, no bounce, no stagger,
  no `animation-delay`: the open and close should feel immediate, not considered.
- A comment in the style of the `marquee` one, saying why height is animated.

### Why animating height is acceptable

The rules prefer `transform`/`opacity` because they stay off the main thread and do not
reflow. Height is the unavoidable exception: the point is that rows below move to make
room, which is layout by definition. Faking it with a transform leaves a gap or overlap
and the rows below jump on completion. The cost is bounded: six items, one paragraph
each, 200ms, one open at a time, no images. Radix measures the content once and exposes
`--radix-accordion-content-height`, so our code does no per-frame measuring. Opacity is the
part that can stay on the compositor.

Radix Presence keeps the closing panel mounted until `animationend`, then unmounts it.
That is what removes a collapsed answer from the accessibility tree (criterion 7) with no
second hiding mechanism: no hand-written `hidden` or `aria-hidden`, and no `height: 0`
pretending to be hidden.

### Wiring it to the primitive

In `accordion.tsx`, on `AccordionContent`: apply the tokens by `data-state`, each behind
`motion-safe:`. Keep `overflow-hidden` on the **content** element, not the item, so the
trigger's focus ring is not clipped (criterion 11). Put padding on an inner wrapper:
padding on the animating element stops `height: 0` reaching zero.

On the trigger: `transition-[color,box-shadow]`. On the chevron:
`motion-safe:transition-transform` plus the 180deg rotation under the open state.

### Reduced motion

`Reveal` uses `useReducedMotion()` because Framer drives values in JS. These keyframes are
CSS, so a hook would add a re-render and still miss the stylesheet; a media query is the
right tool. The house pattern is already in `index.css`: `scroll-behavior: smooth` inside
`@media (prefers-reduced-motion: no-preference)`, "so reduced motion never has to undo it".

Follow it with Tailwind's `motion-safe:` variant, which compiles to that same
`no-preference` query. The animation and the chevron's transition are applied only under
`motion-safe:`. Under `reduce` there is no animation at all, Presence sees
`animation-name: none` and unmounts on the same frame `aria-expanded` flips, and the
chevron still shows its rotated state without transitioning to it. Do not write
`motion-reduce:animate-none` overrides: that is the undo pattern the house style avoids.

**Verify.** Build, lint, test pass. After task 3, `npm run build` then
`grep -l "accordion-reveal" dist/assets/*.css` prints a file (the keyframe was emitted).
Behaviour is browser-only, see task 5: jsdom has no animation engine and cannot show that
a keyframe runs or that reduced motion suppresses it.

## Task 3 - Rewrite the widget

Move `Question` and the `questions` array, with its doc comment, to
`src/widgets/home_faq/model/questions.ts` as a pure move. **Decision point:** the test must
compare rendered text against the source data (criterion 1), and a component file may not
also export non-components (`react-refresh/only-export-components`). Alternatives are
duplicating the strings in the test (a copy edit then updates one place and fails the
test, which is arguably the point, but it is two sources of truth) or exporting from the
widget (lint error). **Recommend the `model/` segment:** it is the FSD home for data. Do it
as a pure move, with the strings byte for byte, including the existing "Your customers
names". Fixing that is a copy change and is out of scope.

Add a stable `id` slug per entry for the item `value`. Using the question text as the value
would work, but an editorial rewrite of a question would then silently change an
identifier, and an `id` is what the deferred deep-link work needs anyway. An `id` is not a
copy change.

Rewrite `home_faq.tsx`:

- `<dl>` becomes `<Accordion type="single" collapsible defaultValue={questions[0].id}>`:
  `type="single"` and `collapsible` are criteria 4 and 5, `defaultValue` is criterion 3.
  Uncontrolled: nothing outside needs the state, so no `useState` and no ARIA is written
  in the widget (criterion 20).
- One `AccordionItem` per question, `AccordionTrigger` holding the question,
  `AccordionContent` holding the answer.
- One `Reveal` around the whole accordion. The heading keeps its own. Delete
  `delay={index * 50}` and the per-item `Reveal`.
- Layout `mx-auto mt-12 flex max-w-3xl flex-col gap-4`; `sm:grid-cols-2` removed.
- Card styling (`rounded-xl border border-border bg-card shadow-sm`, hover to the existing
  `shadow-md`, `transition-shadow` only) goes on each item through one shared class
  constant in the widget, not into the primitive. The primitive stays generic; the card
  look is this feature's decision.
- Trigger: `w-full`, `min-h-11` (44px, criterion 14; a minimum, not a fixed dimension),
  left-aligned text, `items-start` with the chevron `shrink-0` so a wrapped question keeps
  the chevron beside its first line (criterion 13). Strip the generated `hover:underline`.
- Existing tokens only; no colour literals (criterion 21).

### What replaces `dl`/`dt`/`dd`, and is it a loss

Radix renders:

```
div (root)
  div[data-state] (item)
    h3 > button[aria-expanded][aria-controls]   (trigger)
    div[role=region][aria-labelledby]            (content)
```

`h3` is correct: the section's own heading is the `h2`. The `home_page` test reads only
`h1, h2`, so its heading-order assertion is unaffected.

**A net gain, not a loss.** A description list says "term and definition" but exposes no
state and nothing to operate, and screen reader support for it is uneven. The new
structure gives headings to jump between, buttons to operate, and explicit
expanded/collapsed state. Lost is only the claim that these are term/definition pairs,
which nothing depends on.

One caveat: `role="region"` makes each answer a landmark, and the WAI-ARIA guide advises
against it past about six panels. Six is exactly the limit. Acceptable now; see Risks.

**Verify.** Build, lint, test pass (the existing `home_page` test must still pass
untouched). `grep -n "delay=" src/widgets/home_faq/ui/home_faq.tsx` prints nothing.
`grep -c "<Reveal" src/widgets/home_faq/ui/home_faq.tsx` prints `2` (heading plus
accordion). `grep -nE "useState|aria-" src/widgets/home_faq/ui/home_faq.tsx` prints
nothing. `git diff -M` shows the questions as a rename with unchanged strings.

## Task 4 - Tests

`src/widgets/home_faq/ui/home_faq.test.tsx`, next to the widget. Render `HomeFaq` directly;
it needs no router. `src/test/setup.ts` already stubs `matchMedia` and
`IntersectionObserver`, which `Reveal` needs. Use `userEvent.setup()` for everything
interactive (criterion 8 requires it).

| Test | Asserts | Criterion |
| --- | --- | --- |
| six questions in source order | `getAllByRole('button')` names equal `questions.map(q => q.question)` exactly | 1, 2 |
| each question is a button in a heading | for all six, `getByRole('button', { name })` and `.closest('h3')` is not null | 2 |
| first item open on load | button 0 `aria-expanded="true"`, the other five `"false"` | 3 |
| open answer is rendered | first answer text is in the document, matching source | 1 |
| opening closes the other | click item 3: it is `true`, item 0 is `false`, exactly one `aria-expanded="true"` in total | 4 |
| open item can be closed | click item 0 while open: no button has `aria-expanded="true"` | 5 |
| aria wiring both ways | `aria-controls` resolves to an element with `role="region"` whose `aria-labelledby` equals the button's `id`. Run on the open item, then open another and repeat. Closed panels are unmounted, so the target only exists when open | 6 |
| closed answers are not exposed | for each closed answer `queryByText(answer)` is `null` and `queryByRole('region', { name: question })` is `null`. Assert absence, not `not.toBeVisible()`: Radix unmounts closed content, so absence is the true state and the stronger check | 7 |
| Enter and Space toggle | on a focused collapsed button `{Enter}` expands it; `' '` on the now-open item collapses it | 8 |
| arrows, Home, End | focus button 0; `{ArrowDown}` -> 1, `{ArrowUp}` -> 0, `{End}` -> 5, `{Home}` -> 0; `{ArrowDown}` from 5 wraps to 0 | 8 |
| focus stays | after Enter and after click, `document.activeElement` is the same button | 9 |
| no extra tab stops | with an item open, `{Tab}` from its button lands on the next button, not inside the panel | 8 |
| chevron hidden from AT | every button contains an `svg` with `aria-hidden="true"` | 10 |
| BIR answer unchanged | after opening item 2, its answer is in the document and contains `not a tax document` | 22 |

Single `Reveal` and no stagger (criterion 17) are covered by the greps in task 3. A DOM
test for them would test nothing real; do not invent one.

Pitfalls:

- `Reveal` starts at `opacity: 0` and relies on motion to animate it. jsdom does not run
  that, so **do not use `toBeVisible()` on any answer**: it checks opacity and can fail for
  the wrong reason. Use `toBeInTheDocument()` and `queryBy...` absence.
- Each test renders its own tree; open state must not leak between tests.
- If a closing item is still in the document, `await waitFor` or `findBy`; do not add
  timeouts.
- Do not assert that a class string contains `motion-safe:`. It passes whether or not
  reduced motion works.

**Verify.** `npm test` exits 0 with the new file. Then check the tests can fail: temporarily
set `type="multiple"` and "opening closes the other" must fail; temporarily drop
`collapsible` and "open item can be closed" must fail. Revert both.

## Task 5 - Verify in a browser and record

All of this needs **a human in a browser**; none of it can be checked in jsdom, and the plan
does not pretend otherwise. `qa-tester` produces the validation doc; this plan does not.

| Criterion | What to do |
| --- | --- |
| 11 | Tab to each button in light and dark mode. Ring visible, 3:1, not clipped at the row edge or by the content's `overflow-hidden`. |
| 12, 13, 14 | At 320, 768 and 1280: one item per row, `scrollWidth <= clientWidth`, the longest question wraps with the chevron intact, trigger height `>= 44`. |
| 15 | DevTools Animations panel or computed style during a toggle: 200ms, curve matches `--ease-out`, both `height` and `opacity` animate. Record the values. |
| 16 | Emulate `prefers-reduced-motion: reduce` (Rendering tab). No height animation, chevron flips without a transition, `aria-expanded` and content change on the same frame. Switch back to `no-preference` and confirm the animation returns. |
| 18 | Record `scrollY`, toggle with the section fully in view, compare. |
| 19 | Extend the existing contrast script to question, answer and chevron on `bg-card`, hover state included, both themes. If a pair fails, the hover treatment changes, not the threshold. |
| screen reader | One VoiceOver pass: focus a collapsed item and hear question, button, collapsed; activate and hear expanded; move forward and reach the answer once. No automated test reproduces this. |

**Verify.** Each row has a recorded value, not a tick. Build, lint, test exit 0
(criterion 23).

## Risks

**Decision recorded: the BIR question gets no special treatment.** It collapses like
every other item and is not open by default. This was considered, not overlooked. The
concern is real: the answer to "Is this a BIR official receipt?" was on the page for anyone
who scrolled past, and is now one click away, while the product's position is that letting
someone believe otherwise would do real harm. The author settled it on this reasoning: the
disclaimer already has its own prominent section on the Terms page and is stated in the
product copy, so the FAQ is not where that burden sits. Forcing the item open would also
make the section read as a disclaimer. This plan therefore adds no pin, badge, or default
exception, and changes no copy. A later reader proposing one should start from that
reasoning rather than from the concern alone.

**Exit animation depends on `animationend`.** If the keyframe name does not resolve (a
typo, or the token not emitted), Presence sees no animation and unmounts instantly: it
still works, silently without animation. A keyframe that runs but never ends would leave
the panel mounted and in the accessibility tree. The `dist` grep in task 2 and the recorded
durations in task 5 are the checks. The unit tests run with no animation engine and will
not catch either.

**Single-open means two heights change at once.** Opening a second item while another
closes moves rows below in both directions during the 200ms. Not a correctness bug, but the
first place a "janky" report would come from. Watch for it in task 5.

**Generated primitive drift.** The primitive is hand-fixed (import, dependency,
`transition-all`, chevron). A later `shadcn add accordion --overwrite` undoes it and the
same problems return. That is the known cost of generated code here, and why card styling
lives in the widget and motion lives in `index.css`: the hand edits stay small.

**`role="region"` on six panels is at the landmark limit.** Fine for six; a reason not to
quietly add questions.

**Heading level is fixed at `h3`.** Correct under the section's `h2`. If the widget is ever
reused elsewhere, the level is wrong and Radix does not expose it through the shadcn
wrapper as generated.

**Existing copy typo, "Your customers names"** (missing apostrophe), is left alone on
purpose. Reported so the author can decide if it becomes its own copy change.

**Deferred, not forgotten.** Deep-linking to an item, multi-open mode and a copy review,
as in `requirements.md`. The `id` field from task 3 is the only groundwork for the first.
