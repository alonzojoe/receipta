import { legal_contact_url } from '@/shared/config/legal'
import { LegalDocument } from '@/widgets/legal_document'
import { SiteFooter } from '@/widgets/site_footer'
import { SiteHeader } from '@/widgets/site_header'

export function TermsPage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <LegalDocument
          title="Terms & Conditions"
          summary="What Receipta is, what it is not, and what you are responsible for."
        >
          <section>
            <h2>Accepting these terms</h2>
            <p>
              By using Receipta you accept these terms. If you do not agree with them,
              please do not use it.
            </p>
          </section>

          <section>
            <h2>What Receipta is</h2>
            <p>
              Receipta is a free tool that formats the details you type into a receipt
              you can export as a PDF or an image and send to a customer. It runs
              entirely in your browser. It is a document generator and nothing more.
            </p>
          </section>

          <section>
            <h2>What Receipta is not</h2>
            <p>
              <strong>
                A receipt produced by Receipta is not a BIR Official Receipt.
              </strong>{' '}
              An Official Receipt in the Philippines carries requirements that this tool
              does not meet, including registration with the Bureau of Internal Revenue,
              controlled serial numbering, and prescribed retention. Receipta does not
              register anything with any authority and does not issue tax documents.
            </p>
            <p>
              Treat what it produces as a courtesy acknowledgement of a payment. If your
              business is required to issue official receipts, invoices, or any other
              statutory document, you must still issue those separately. Using a
              Receipta document in place of one you are legally required to issue is
              your responsibility and not a use this tool supports.
            </p>
            <p>
              Receipta is also not accounting software, not a bookkeeping system, not a
              payment processor, and does not move money.
            </p>
          </section>

          <section>
            <h2>Your responsibilities</h2>
            <ul>
              <li>
                The accuracy of everything you enter. Receipta formats what you type and
                does not verify it.
              </li>
              <li>
                Meeting whatever tax, invoicing, and record-keeping obligations apply to
                you.
              </li>
              <li>
                Using it lawfully. Do not use it to produce misleading documents, to
                impersonate another business, or to misrepresent a payment that did not
                happen.
              </li>
              <li>
                Handling other people&rsquo;s information properly once a receipt leaves
                your device.
              </li>
            </ul>
          </section>

          <section>
            <h2>Your content</h2>
            <p>
              What you enter and what you export is yours. Receipta claims no ownership
              over it and never receives a copy, since nothing is transmitted.
            </p>
          </section>

          <section>
            <h2>Availability and changes</h2>
            <p>
              Receipta is provided free and as is. It may change, break, or stop being
              available at any time, without notice. No level of availability is
              promised.
            </p>
          </section>

          <section>
            <h2>No warranty</h2>
            <p>
              Receipta is provided without warranties of any kind, express or implied,
              including fitness for a particular purpose. It is not guaranteed to be
              error free, and it is not guaranteed that a document it produces will be
              accepted by anyone for any purpose.
            </p>
          </section>

          <section>
            <h2>Limitation of liability</h2>
            <p>
              To the fullest extent the law allows, Receipta and its author are not
              liable for any loss arising from your use of it. That includes lost
              income, disputed payments, penalties, and anything following from an
              inaccurate or rejected document. You are responsible for checking a
              receipt before you send it.
            </p>
          </section>

          <section>
            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of the Republic of the Philippines.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about these terms can be raised on the{' '}
              <a href={legal_contact_url} target="_blank" rel="noopener noreferrer">
                project repository
              </a>
              .
            </p>
          </section>
        </LegalDocument>
      </main>
      <SiteFooter />
    </div>
  )
}
