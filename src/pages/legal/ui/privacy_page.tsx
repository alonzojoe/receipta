import { legal_contact_url } from '@/shared/config/legal'
import { LegalDocument } from '@/widgets/legal_document'
import { SiteFooter } from '@/widgets/site_footer'
import { SiteHeader } from '@/widgets/site_header'

export function PrivacyPage() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col">
        <LegalDocument
          title="Privacy Policy"
          summary="Receipta does not collect your data, because there is nowhere for it to go."
        >
          <section>
            <h2>The short version</h2>
            <p>
              Receipta runs entirely in your browser. There is no account to create, no
              server to send anything to, and no analytics watching what you do. The
              receipts you build, the names you type, and the photos you attach stay on
              your device.
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <p>
              Nothing. We do not receive your name, your customers&rsquo; names, your
              amounts, your item photos, or your payment details, because none of it is
              ever transmitted anywhere.
            </p>
          </section>

          <section>
            <h2>What is stored on your device</h2>
            <p>
              Two things are saved in your browser&rsquo;s local storage, and both stay
              on your device:
            </p>
            <ul>
              <li>
                Your theme choice &mdash; whether you picked light, dark, or to follow
                your device.
              </li>
              <li>
                Your receipt draft &mdash; the receipt you are working on, including
                customer names, items, amounts, payment details, notes, and any photos
                you attached. Photos are saved inside the draft as shrunken images. It is
                kept as plain text and is not encrypted, so anyone who can use this
                browser profile can read it.
              </li>
            </ul>
            <p>
              Nothing else is stored. The <a href="/cookies">Cookie Policy</a> sets it
              out in detail.
            </p>
          </section>

          <section>
            <h2>Receipt contents</h2>
            <p>
              Everything you enter while building a receipt is used only to render what
              you see and to produce the file you export. While you work, it is also
              saved on this device as a draft, so closing the tab or reloading the page
              does not lose it. The draft stays until you use Clear draft or clear your
              browser data. It is never sent to us or anyone else. The exported PDF or
              image is saved straight to your device by your browser; it does not pass
              through us.
            </p>
            <p>
              If the browser has no room left, or storage is turned off, the draft may
              not be saved. The form says so when that happens.
            </p>
          </section>

          <section>
            <h2>What we do not do</h2>
            <ul>
              <li>No accounts, no sign-in, no email collection.</li>
              <li>No analytics, tracking pixels, or session recording.</li>
              <li>No advertising, and no sharing or selling of anything.</li>
              <li>
                No third-party requests. Even the fonts are served from Receipta itself
                rather than an external provider, so loading the page does not tell
                anyone else that you visited.
              </li>
            </ul>
          </section>

          <section>
            <h2>Removing your data</h2>
            <p>
              Because everything is held locally, you remove it yourself. To delete the
              receipt draft, use Clear draft on the receipt form: it removes everything
              you entered, including photos. To remove everything Receipta has stored,
              including your theme choice, clear site data for Receipta in your browser
              settings. Private browsing discards both when you close the window. You do
              not need to ask us, and there is no request for us to fulfil.
            </p>
          </section>

          <section>
            <h2>Philippine data protection</h2>
            <p>
              The Data Privacy Act of 2012 governs the processing of personal
              information in the Philippines. Receipta operates no server and processes
              no personal information outside your browser, so anything you enter
              remains under your sole control. If you put another person&rsquo;s details
              on a receipt, you decide how that receipt is handled once you export it.
            </p>
          </section>

          <section>
            <h2>Children</h2>
            <p>
              Receipta is a business tool and is not directed at children. Since it
              collects nothing from anyone, it collects nothing from children either.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              If Receipta ever starts storing or transmitting anything beyond what is
              described above, this page will be updated before that change ships, and
              the date at the top will change with it.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this policy can be raised on the{' '}
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
