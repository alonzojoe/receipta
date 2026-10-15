import { LuCircleAlert, LuInfo } from 'react-icons/lu'

import { cn } from '@/shared/lib/utils'

import type { WriteResult } from '../model/draft_storage'

export const unreadable_message = 'A saved draft could not be read, so a new one was started'
export const saved_without_photos_message =
  'Saved without photos. Photos are kept while this tab is open but will need to be re-attached if you reload.'
export const not_saved_message = 'Not saved. Your work will be lost if you close this page.'

type DraftStatusProps = {
  /** The outcome of the latest write, or null before anything has been written. */
  result: WriteResult | null
  /** The draft found on load could not be read. */
  unreadable: boolean
}

/**
 * Persistent, inline and announced: never only a toast that disappears. A clean save
 * says nothing. Both failures stay until a later write returns `saved`.
 */
export function DraftStatus({ result, unreadable }: DraftStatusProps) {
  if (result === 'not_saved') {
    return <Banner role="alert" tone="danger" message={not_saved_message} />
  }
  if (result === 'saved_without_photos') {
    return <Banner role="status" tone="notice" message={saved_without_photos_message} />
  }
  if (unreadable && result === null) {
    return <Banner role="status" tone="notice" message={unreadable_message} />
  }
  return null
}

function Banner({
  role,
  tone,
  message,
}: {
  role: 'status' | 'alert'
  tone: 'notice' | 'danger'
  message: string
}) {
  const Icon = tone === 'danger' ? LuCircleAlert : LuInfo
  return (
    <div
      role={role}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm',
        tone === 'danger'
          ? 'border-destructive/40 bg-destructive/10 text-foreground'
          : 'border-border bg-surface-tint text-foreground',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-destructive' : 'text-primary')}
      />
      <p className="min-w-0 break-words">{message}</p>
    </div>
  )
}
