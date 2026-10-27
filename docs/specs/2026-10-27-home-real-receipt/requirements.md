# Show the real receipt on the home page

## Goal

The author:

> "for the receipt in home page — replace it with preview of ours i think?"

The hero shows `MockReceipt`, a hand-built card that resembles a receipt. The product now
produces a real one, so the landing page can show the actual artefact instead of an
illustration of it.

This was always the plan. The mock's own comment says so: *"Phase 1 replaces this against
the real data model. Nothing outside this widget may import it."*

## Why it is worth doing

A mock drifts. It already does: it shows a `PAID` chip the real receipt does not have, it
has no payment method, no receipt number, no statement, and its discount reads differently.
Every change to the real document widens that gap, and the page that sells the product ends
up showing something the product does not make.

Replacing it also means the landing page cannot lie: whatever a visitor sees is produced by
the same component, from the same view model, as the file they will download.

## The decision that matters: the white sheet

The mock **follows the app theme**, deliberately — its comment says *"a page where one card
stubbornly stays white makes the theme switch look broken."*

The real document is **always white**, equally deliberately, and that is load-bearing: it is
what makes an export from dark mode identical to one from light mode.

So putting the real document in the hero means a white sheet on a dark page. **That is
correct and should be kept**, for three reasons:

- It is what the user actually gets. A receipt is a piece of paper; showing it as paper on
  a dark page reads as a document, not as a broken card.
- The alternative is a themed copy of the real document, which is the mock again — a second
  implementation that drifts from the first.
- The hero already frames it: a shadow and a slight tilt make it read as a sheet lying on
  the page rather than as a panel that forgot to re-theme.

If it reads badly on screen, the fix is the framing — a stronger shadow, a border, a tinted
surface behind it — not re-theming the document.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| What renders | `ReceiptDocument` from `entities/receipt`, the same component the export rasterises | One implementation. A widget may import an entity, so the direction is legal. |
| The data | A `demo_receipt` built through `build_receipt_view`, from a `ReceiptInput` like any other | Built by the real function, so it cannot describe a receipt the product cannot produce. A hand-written `ReceiptView` could. |
| Photos in the demo | **None** | Item photos are data URLs; embedding one puts a base64 image in the landing page's bundle for decoration. The demo shows two plain lines. |
| Scaling | The same transform technique as the export preview, in the widget | `ReceiptPreview` carries export chrome — a labelled region and a bordered frame — which marketing does not want. The technique is three lines; the component is not reusable here. |
| Weight | `contain` on the frame, as the preview has | It is a whole document in the first screen of the landing page. |
| The tilt and hover | Kept from the mock | It is the one piece of the mock that was doing real work: it makes the sheet read as an object rather than a panel. |
| `MockReceipt` | **Deleted**, not left unused | Its comment says nothing outside the widget may import it, and nothing does. A second receipt implementation left in the tree is one someone will later "fix" to match. |

## Acceptance criteria

1. The hero renders `ReceiptDocument`, not a hand-built card.
2. The view it renders comes from `build_receipt_view`, so it cannot diverge from the real
   shape.
3. The demo receipt has at least two line items, a discount with a description, a payment
   method, and no item photos.
4. The sheet is white in both themes, and the home page's own surfaces still follow the
   theme.
5. `mock_receipt.tsx` is deleted, and nothing references it.
6. The hero's heading, copy and calls to action are unchanged.
7. No test asserts the mock's content any more; the hero's tests assert the real
   document's.
8. `npm run build`, `npm run lint` and `npm test` exit 0.

## Verification

No browser is available on this project. Everything above is verified through the rendered
DOM and the stylesheet. **What cannot be verified here is how a white sheet looks on the
dark hero** — whether the framing carries it or whether it reads as a mistake. That is for
the author on screen, and the spec names the lever if it reads badly: the framing, not the
document.

## Deferred

- Animating the sheet, or showing more than one.
- Making the demo data configurable, or seasonal.
