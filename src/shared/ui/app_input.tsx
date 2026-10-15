import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

type AppInputProps = ComponentProps<'input'> & {
  /**
   * Fixed text drawn inside the control before the value, such as the peso sign. It is
   * decoration for the eye (`aria-hidden`), not part of the value, so a screen reader
   * hears the label and the user types digits only.
   */
  adornment?: ReactNode
}

/**
 * The project's single-line text input. The look lives in `control_style.ts`, reached
 * through the shadcn `Input`; this adds only the adornment. The ref is the real
 * `<input>`, and every native prop passes through.
 */
export function AppInput({ adornment, className, ...props }: AppInputProps) {
  if (adornment === undefined) return <Input className={className} {...props} />

  return (
    <div className="relative w-full">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground"
      >
        {adornment}
      </span>
      <Input className={cn('pl-8', className)} {...props} />
    </div>
  )
}
