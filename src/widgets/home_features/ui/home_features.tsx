import type { IconType } from 'react-icons'
import {
  LuDownload,
  LuImage,
  LuPhilippinePeso,
  LuShieldCheck,
  LuSparkles,
  LuWallet,
} from 'react-icons/lu'

import { Reveal } from '@/shared/ui/reveal'
import { Section } from '@/shared/ui/section'

type Feature = {
  icon: IconType
  title: string
  body: string
}

const features: readonly Feature[] = [
  {
    icon: LuSparkles,
    title: 'Looks deliberate',
    body: 'A real document instead of a forwarded screenshot of a transaction.',
  },
  {
    icon: LuWallet,
    title: 'Works with how you get paid',
    body: 'GCash, Maya, MariBank, and bank transfer, named on the receipt.',
  },
  {
    icon: LuPhilippinePeso,
    title: 'Peso-perfect',
    body: 'Every amount formatted the way it should be, down to the centavo.',
  },
  {
    icon: LuImage,
    title: 'Item photos',
    body: 'Attach a picture to any line item, so there is no question what was sold.',
  },
  {
    icon: LuDownload,
    title: 'PDF or image',
    body: 'PDF when it needs printing, image when it needs sending in chat.',
  },
  {
    icon: LuShieldCheck,
    title: 'Private by default',
    body: 'No account, no server, nothing uploaded. It all stays in your browser.',
  },
]

export function HomeFeatures() {
  return (
    <Section id="why-receipta" className="bg-muted/40">
      <Reveal>
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Why Receipta
          </h2>
          <p className="mx-auto max-w-xl text-balance text-muted-foreground">
            Small things that make a receipt look like you meant to send it.
          </p>
        </div>
      </Reveal>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 50}>
            <li className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-[box-shadow,border-color] duration-200 ease-out hover:border-primary/40 hover:shadow-md">
              <span className="brand-gradient inline-flex size-9 items-center justify-center rounded-lg text-white shadow-sm">
                <feature.icon className="size-4.5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-medium tracking-tight">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.body}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
