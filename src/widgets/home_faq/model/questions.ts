export type Question = {
  id: string
  question: string
  answer: string
}

/**
 * The BIR question is deliberately first among the hard ones and answered plainly.
 * Receipta produces a proof-of-payment document, not a registered official receipt,
 * and a tool that lets someone believe otherwise would be doing real harm.
 */
export const questions: readonly Question[] = [
  {
    id: 'free',
    question: 'Is it really free?',
    answer:
      'Yes. There is no account, no trial, and no paid tier. Receipta runs entirely in your browser, so there is nothing for us to bill you for.',
  },
  {
    id: 'bir',
    question: 'Is this a BIR official receipt?',
    answer:
      'No, and it should not be used as one. An official receipt has registration, numbering, and retention requirements that this tool does not meet. Receipta produces a proof-of-payment document you can send a customer, not a tax document.',
  },
  {
    id: 'data',
    question: 'Where is my data stored?',
    answer:
      'On your device, and nowhere else. Your customers’ names, your amounts, and your item photos never leave your browser. There is no server to send them to.',
  },
  {
    id: 'account',
    question: 'Do I need an account?',
    answer:
      'No. Open it, fill it in, export the receipt. Nothing to sign up for and nothing to remember.',
  },
  {
    id: 'business',
    question: 'Can I use it for my small business?',
    answer:
      'Yes. Issue under a company name or your own name, whichever fits. Just remember it is a courtesy receipt, not a substitute for whatever your business is required to issue.',
  },
  {
    id: 'cash',
    question: 'What if I get paid in cash?',
    answer:
      'That works too. Pick the payment method that matches, and leave the reference number blank when there is no transaction to point at.',
  },
]
