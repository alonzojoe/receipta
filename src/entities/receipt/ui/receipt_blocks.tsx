import type { ReactNode } from 'react'

import logo_mark_src from '@/shared/assets/logo_mark.webp'
import wordmark_light_src from '@/shared/assets/wordmark_light.webp'

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
        {/* The mark, top right on the title's line. Violet by being the logo, not by a rule. */}
        <img
          src={logo_mark_src}
          alt=""
          data-logo="receipta"
          width={256}
          height={256}
          loading="eager"
          className="receipt-mark"
        />
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
            width={56}
            height={56}
            loading="eager"
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
              <dt>{receipt_labels.discount}</dt>
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

function Footer({ label }: { label?: string }) {
  return (
    <div className="receipt-footer">
      <div className="receipt-footer-credit">
        <span className="receipt-label">{receipt_labels.generated_by}</span>
        {/* The light wordmark only. LogoWordmark also renders the dark one and hides one of the
            two with a `dark:` class, which on a dark-mode export shows near-white on white. */}
        <img
          src={wordmark_light_src}
          alt="Receipta"
          data-logo="receipta"
          width={211}
          height={48}
          loading="eager"
          className="receipt-footer-wordmark"
        />
      </div>
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
          <Payment payment={view.payment} />
          {view.notes !== null && <Notes notes={view.notes} />}
          <p className="receipt-label receipt-statement">{receipt_statement}</p>
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
