import type { ComponentProps } from 'react'

import { Textarea } from '@/shared/ui/textarea'

type AppTextareaProps = ComponentProps<'textarea'>

/**
 * The multi-line sibling of `AppInput`. A separate component rather than a mode, so the
 * element, its ref and its handlers stay honestly typed. Same look, from the same
 * `control_style.ts`. Pass no `maxLength`: a native cap truncates a paste silently, and
 * the rule that names the limit could never fire.
 */
export function AppTextarea(props: AppTextareaProps) {
  return <Textarea {...props} />
}
