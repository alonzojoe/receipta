import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

type Question = {
  question: string
  answer: string
}

/**
 * The BIR question is deliberately first among the hard ones and answered plainly.
 * Receipta produces a proof-of-payment document, not a registered official receipt,
 * and a tool that lets someone believe otherwise would be doing real harm.
 */
const questions: readonly Question[] = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. There is no account, no trial, and no paid tier. Receipta runs entirely in your browser, so there is nothing for us to bill you for.',
  },
  {
    question: 'Is this a BIR official receipt?',
    answer:
      'No, and it should not be used as one. An official receipt has registration, numbering, and retention requirements that this tool does not meet. Receipta produces a proof-of-payment document you can send a customer, not a tax document.',
  },
  {
    question: 'Where is my data stored?',
    answer:
      'On your device, and nowhere else. Your customers names, your amounts, and your item photos never leave your browser. There is no server to send them to.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'No. Open it, fill it in, export the receipt. Nothing to sign up for and nothing to remember.',
  },
  {
    question: 'Can I use it for my small business?',
    answer:
      'Yes. Issue under a company name or your own name, whichever fits. Just remember it is a courtesy receipt, not a substitute for whatever your business is required to issue.',
  },
  {
    question: 'What if I get paid in cash?',
    answer:
      'That works too. Pick the payment method that matches, and leave the reference number blank when there is no transaction to point at.',
  },
]

export function HomeFaq() {
  return (
    <Section id="faq" className="bg-surface-tint">
      <Reveal>
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            The things worth knowing before you send your first receipt.
          </p>
        </div>
      </Reveal>

      <dl className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
        {questions.map((item, index) => (
          <Reveal key={item.question} delay={index * 50}>
            <div className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <dt className="text-base font-medium tracking-tight">{item.question}</dt>
              <dd className="text-sm text-muted-foreground">{item.answer}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </Section>
  )
}
