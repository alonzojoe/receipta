import { LuFileText, LuImage, LuLoaderCircle } from 'react-icons/lu'

import type { ExportKind } from '@/entities/receipt'
import { Button } from '@/shared/ui/button'

type ExportButtonsProps = {
  busy: ExportKind | null
  on_start: (kind: ExportKind) => void
}

const labels = {
  pdf: { idle: 'Download PDF', busy: 'Preparing PDF...' },
  png: { idle: 'Download image', busy: 'Preparing image...' },
} as const

/**
 * The two downloads. Real buttons with `type="button"`: Review sits inside the wizard's
 * <form>, and a default `submit` would trigger Next.
 *
 * While one runs, both are inert. The running button uses `aria-disabled` rather than
 * `disabled`, because disabling a focused button drops focus in some browsers and the spec
 * wants it to keep it; the click is ignored. The other one is simply `disabled`.
 */
export function ExportButtons({ busy, on_start }: ExportButtonsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {(['pdf', 'png'] as const).map((kind) => {
        const running = busy === kind
        const Icon = kind === 'pdf' ? LuFileText : LuImage
        return (
          <Button
            key={kind}
            type="button"
            variant={kind === 'pdf' ? 'default' : 'outline'}
            disabled={busy !== null && !running}
            aria-disabled={running ? true : undefined}
            aria-busy={running ? true : undefined}
            className={`h-auto min-h-11 w-full gap-2 px-4 text-base sm:w-auto sm:min-w-48 ${running ? 'cursor-progress' : ''}`}
            onClick={() => {
              if (busy === null) on_start(kind)
            }}
          >
            {running ? (
              <LuLoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Icon aria-hidden="true" />
            )}
            {running ? labels[kind].busy : labels[kind].idle}
          </Button>
        )
      })}
    </div>
  )
}
