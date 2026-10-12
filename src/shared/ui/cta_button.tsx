import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

type CtaButtonProps = ComponentProps<typeof Button>

/**
 * A marketing-sized button.
 *
 * shadcn's size scale tops out at 36px, which is right for dense application UI and
 * too small for a landing page's primary action. Height is set with padding and
 * h-auto rather than a fixed height, so the control still grows with its text and
 * stays inside the project's fluid-sizing rule.
 */
export function CtaButton({ className, ...props }: CtaButtonProps) {
  return (
    <Button
      size="lg"
      className={cn(
        'h-auto gap-2 rounded-xl px-6 py-3 text-base font-medium',
        '[&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    />
  )
}
