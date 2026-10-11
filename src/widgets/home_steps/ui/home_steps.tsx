import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

type Step = {
  title: string
  body: string
}

const steps: readonly Step[] = [
  {
    title: 'Fill in the details',
    body: 'Your name or your company, who it is for, and what they paid for. Add a photo to any item.',
  },
  {
    title: 'Review the summary',
    body: 'Check the line items, the discount, and the total before anything is final.',
  },
  {
    title: 'Export and send',
    body: 'Download a PDF to print or an image to send in chat. Then get on with your day.',
  },
]

export function HomeSteps() {
  return (
    <Section id="how-it-works">
      <Reveal>
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps, about a minute
          </h2>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            No account to make, no template to pick, no settings to learn.
          </p>
        </div>
      </Reveal>

      <ol className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 60}>
            <li className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors duration-200 ease-out hover:border-primary/40">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="text-lg font-medium tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
