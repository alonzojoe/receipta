import type { ReactNode } from 'react'

import logo_mark_src from '@/shared/assets/logo_mark.webp'
import { site } from '@/shared/config/site'
import wordmark_light_src from '@/shared/assets/wordmark_light.webp'

import { thumbnail_size } from '../model/type_scale'
import {
  receipt_labels,
  receipt_statement,
  type ItemView,
  type PaymentView,
  type ReceiptView,
  type TotalsView,
} from '../model/receipt_view'

import './receipt_document.css'

/*
 * The blocks of the receipt, as plain markup. `ReceiptDocument` stacks them in one column
 * and `ReceiptPage` deals them out across pages, so there is one markup for each block and
 * two compositions. They take the view-model and lay text out; they do no arithmetic and no
 * formatting (the view built every string), and they use no context, no theme hook and no
 * icon package, because the sheet is white whatever the app is doing.
 *
 * `data-measure` names the units pagination adds up. A unit's height must be the sum of its
 * parts, which is why the CSS spaces with padding and never with a vertical margin.
 *
 * The structure follows a Stripe-style receipt (author direction): the title and the mark, a
 * small label/value block, the two parties, the amount as one sentence, the item table, the
 * summary, the payment, the statement and the footer.
 */

/** The top of the first page: everything above the item table. */
export function FirstTop({ view }: { view: ReceiptView }) {
  return (
    <div data-measure="first_top">
      <div className="receipt-title-row">
        <p className="receipt-title">{receipt_labels.title}</p>
      </div>

      <dl className="receipt-meta">
        <div className="receipt-meta-row">
          <dt>{receipt_labels.receipt_no}</dt>
          <dd>{view.receipt_no}</dd>
        </div>
        <div className="receipt-meta-row">
          <dt>{receipt_labels.date}</dt>
          <dd>{view.date}</dd>
        </div>
      </dl>

      <div className="receipt-parties">
        <div className="receipt-party">
          <p className="receipt-label">{receipt_labels.issued_by}</p>
          <p className="receipt-party-name">{view.issuer}</p>
        </div>
        <div className="receipt-party">
          <p className="receipt-label">{receipt_labels.issued_to}</p>
          <p className="receipt-party-name">{view.recipient}</p>
        </div>
      </div>

      {view.paid_line !== null && <p className="receipt-lead">{view.paid_line}</p>}
    </div>
  )
}

/** The table's heading row. It opens the table on every page, not only the first. */
export function TableHead() {
  return (
    <div data-measure="table_head" role="row" className="receipt-grid receipt-table-head">
      <div role="columnheader">{receipt_labels.description}</div>
      <div role="columnheader" className="receipt-num">
        {receipt_labels.qty}
      </div>
      <div role="columnheader" className="receipt-num">
        {receipt_labels.unit_price}
      </div>
      <div role="columnheader" className="receipt-num">
        {receipt_labels.amount}
      </div>
    </div>
  )
}

type ItemRowProps = {
  item: ItemView
  /** 1-based, as the user counts items. */
  number: number
  /** True when any item has a photo: every row then keeps the 56 px column. */
  reserve_column: boolean
}

/** One item. A row with no photo has no image element and no placeholder, only empty space. */
export function ItemRow({ item, number, reserve_column }: ItemRowProps) {
  const has_photo = item.image !== null
  const indent = reserve_column && !has_photo
  return (
    <div
      data-measure="row"
      role="row"
      className={has_photo ? 'receipt-grid receipt-row receipt-row-photo' : 'receipt-grid receipt-row'}
    >
      <div role="cell" className="receipt-description">
        {has_photo && (
          <img
            src={item.image ?? ''}
            alt=""
            data-item={number}
            width={thumbnail_size}
            height={thumbnail_size}
            loading="eager"
            /*
             * The source is up to 800px on its longest edge and is painted into 56px, so
             * the browser downsamples a large bitmap every time this repaints. `async`
             * keeps that off the main thread, and the explicit box means it never has to
             * reflow around a late decode. The export needs the full source, so the image
             * itself cannot be smaller.
             */
            decoding="async"
            className="receipt-thumb"
          />
        )}
        <p className={indent ? 'receipt-row-name receipt-row-name-indent' : 'receipt-row-name'}>{item.name}</p>
      </div>
      <div role="cell" className="receipt-num">
        {item.quantity}
      </div>
      <div role="cell" className="receipt-num">
        {item.unit_price}
      </div>
      <div role="cell" className="receipt-num">
        {item.amount}
      </div>
    </div>
  )
}

/** The compact header of every page after the first: whose receipt, which receipt, which page. */
export function ContinuationHead({ view, label }: { view: ReceiptView; label: string }) {
  return (
    <div data-measure="running_head" className="receipt-running-head">
      <p className="receipt-running-issuer">{view.issuer}</p>
      <div className="receipt-running-meta receipt-small">
        <p>{view.receipt_no}</p>
        <p>{view.date}</p>
        <p>{label}</p>
      </div>
    </div>
  )
}

/**
 * Subtotal and Discount (only with a discount), then Total, then Amount paid as the closing
 * bold row. Right-aligned to the Amount column's right edge. The discount keeps its stack
 * whenever there is one.
 */
function Summary({ totals, measured }: { totals: TotalsView; measured: boolean }) {
  return (
    <div data-measure={measured ? 'totals' : undefined} className="receipt-summary">
      <dl className="receipt-summary-table">
        {totals.subtotal !== null && totals.discount !== null && (
          <>
            <div className="receipt-summary-row">
              <dt>{receipt_labels.subtotal}</dt>
              <dd>{totals.subtotal}</dd>
            </div>
            <div className="receipt-summary-row">
              <dt>{totals.discount_label}</dt>
              <dd>{totals.discount}</dd>
            </div>
          </>
        )}
        <div className="receipt-summary-row receipt-summary-strong">
          <dt>{receipt_labels.total}</dt>
          <dd>{totals.total}</dd>
        </div>
        <div className="receipt-summary-row receipt-summary-paid">
          <dt>{receipt_labels.amount_paid}</dt>
          <dd>{totals.total}</dd>
        </div>
      </dl>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="receipt-section">
      <p className="receipt-section-title">{title}</p>
      {children}
    </div>
  )
}

/**
 * A small section with a heading, a hairline and one row of labelled columns. Two shapes, both
 * deliberate:
 *
 * - with a reference: Payment method | Reference number, two equal columns;
 * - without one: Payment method alone, at the left, and no Reference column at all. Not an empty
 *   cell, not a dash, and above all not a "Reference number" heading over empty space.
 *
 * It carries neither the date nor the amount. The date is in the metadata block and the
 * sentence, and the amount is in the sentence, the Total and the bold Amount paid row directly
 * above: a receipt has exactly one payment, so a row that repeats them again is not a log
 * entry, it is a fourth copy. The 28 px logo sits beside the method name.
 */
function Payment({ payment }: { payment: PaymentView }) {
  return (
    <Section title={receipt_labels.payment}>
      <div className="receipt-payment-grid">
        <div>
          <p className="receipt-label">{receipt_labels.payment_method}</p>
          <div className="receipt-payment-cell receipt-payment-method">
            {payment.icon !== null && (
              <img
                src={payment.icon}
                alt=""
                data-logo="payment"
                width={28}
                height={28}
                loading="eager"
                className="receipt-payment-logo"
              />
            )}
            <span className="receipt-wrap">{payment.name}</span>
          </div>
        </div>
        {payment.reference !== null && (
          <div>
            <p className="receipt-label">{receipt_labels.reference_no}</p>
            <p className="receipt-payment-cell receipt-wrap">{payment.reference}</p>
          </div>
        )}
      </div>
    </Section>
  )
}

function Notes({ notes }: { notes: string }) {
  return (
    <Section title={receipt_labels.notes}>
      {/* pre-wrap keeps the line breaks; React renders the text as text, never as HTML. */}
      <p className="receipt-notes-text">{notes}</p>
    </Section>
  )
}

/**
 * The paid-in-full stamp, in the empty space above the footer on the last page.
 *
 * In normal flow and measured, not absolutely positioned: pagination deals out units by
 * their measured height, and a stamp with no height would be planned as if it were not
 * there and would land on the footer. The rotation is a `transform`, which does not change
 * the layout box, so the measured height is the unrotated one; the wrapper's padding is
 * sized from the geometry of turning the box, so the rotated ink stays inside it.
 *
 * The claim is safe to print unconditionally: a Receipta receipt records one payment that
 * has already happened, and the amount paid is the total after any discount. There is no
 * state where a receipt exists and this is false. A partial-payment feature would have to
 * make this conditional on the same day.
 */
function PaidStamp() {
  return (
    <div className="receipt-stamp-wrap">
      {/* One rotated group: the bordered box carries the claim, the thanks sits under the
          box rather than inside it, as a rubber stamp does. */}
      <div className="receipt-stamp">
        <p className="receipt-stamp-box">Paid in full</p>
        <p className="receipt-stamp-thanks">Thank you!</p>
      </div>
    </div>
  )
}

function Footer({ label }: { label?: string }) {
  return (
    <div className="receipt-footer">
      {/*
        * A real link, so the preview and anyone reading the HTML can follow it. It is NOT
        * clickable in the PDF or the PNG: both are rasterised, so the anchor becomes
        * pixels. A live PDF link needs a jsPDF annotation placed over this element's
        * measured rect, which is its own piece of work and cannot be verified without
        * opening a real PDF.
        *
        * rel: the receipt is a file that gets forwarded, so the link opens away from
        * whatever page is showing it and is given no referrer.
        */}
      <a
        className="receipt-footer-credit"
        href={site.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span className="receipt-label">{receipt_labels.generated_by}</span>
        {/* The mark and the wordmark as one lockup. The mark is the document's only brand
            colour besides the amount, and it sits here rather than in the header so there
            is one logo in one place. Both keep data-logo: the rasteriser waits on those
            images, and one that moved without the attribute would not be waited for. */}
        <span className="receipt-footer-lockup">
          <img
            src={logo_mark_src}
            alt=""
            data-logo="receipta"
            width={256}
            height={256}
            loading="eager"
            className="receipt-footer-mark"
          />
          {/* The light wordmark only. LogoWordmark also renders the dark one and hides one of
              the two with a `dark:` class, which on a dark-mode export shows near-white on
              white. */}
          <img
            src={wordmark_light_src}
            alt="Receipta"
            data-logo="receipta"
            width={211}
            height={48}
            loading="eager"
            className="receipt-footer-wordmark"
          />
        </span>
      </a>
      {label !== undefined && <p className="receipt-label receipt-page-label">{label}</p>}
    </div>
  )
}

type TailPart = 'whole' | 'totals' | 'rest'

/**
 * The summary, the payment, the notes, the statement and the footer: the unit the last row
 * travels with, so the summary never splits across a page and never sits without an item row.
 * In the one case where a single item cannot share a page with all of it, the tail is dealt
 * out in two parts, the summary first and the rest after. `label` is `Page N of M`, shown
 * bottom right on the last page of a multi-page receipt.
 */
export function Tail({ view, part = 'whole', label }: { view: ReceiptView; part?: TailPart; label?: string }) {
  return (
    <div data-measure={part === 'whole' ? 'tail' : undefined}>
      {part !== 'rest' && <Summary totals={view.totals} measured={part === 'whole'} />}
      {part !== 'totals' && (
        <>
          {/* Payment, notes and the statement sit left; the stamp overlays the empty right
              of the same block, so both sides of the page are used and the stamp costs no
              height of its own. The block reserves enough height that the stamp always
              fits inside it, which is what keeps the measured tail honest. */}
          <Payment payment={view.payment} />
          {view.notes !== null && <Notes notes={view.notes} />}
          {/* The statement and the stamp share a row: both sides of the page are used, and
              the row's height is measured like everything else. An absolutely positioned
              stamp filled the same space for free, but it also sat on top of a long
              reference number, the end of a long note and the footer's rule - nothing
              catches that, because an out-of-flow child adds no height for the page plan
              to notice. */}
          <div className="receipt-statement-row">
            <p className="receipt-label receipt-statement">{receipt_statement}</p>
            <PaidStamp />
          </div>
          <Footer label={label} />
        </>
      )}
    </div>
  )
}

/**
 * Bottom of every page but the last: the statement, so a page forwarded alone still says it.
 * Both places print the model's constant, not a field of the view, so no input can remove it.
 */
export function FootBand({ view, label }: { view: ReceiptView; label: string }) {
  return (
    <div data-measure="foot_band" className="receipt-foot-band">
      <p className="receipt-label receipt-foot-statement">{receipt_statement}</p>
      <p className="receipt-label receipt-wrap">
        {view.receipt_no} - {label}
      </p>
    </div>
  )
}
