import { payment_modes } from '@/shared/config/site'
import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

/**
 * Provider labels only. react-icons carries no Philippine fintech marks, and official
 * brand assets have not been sourced, so no logo is invented here. Each item is its
 * own flex row so a mark can be dropped in beside the label without restructuring.
 */
export function HomePaymentModes() {
  return (
    <Section className="pt-4 pb-12 sm:pt-6 sm:pb-16">
      <Reveal>
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">
            Works with how you already get paid
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {payment_modes.map((mode) => (
              <li
                key={mode.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm"
              >
                {mode.label}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  )
}
