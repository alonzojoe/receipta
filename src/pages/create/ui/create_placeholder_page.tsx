import { Link } from '@tanstack/react-router'

/**
 * Stands in for the receipt builder until Phase 1. The home page's primary call to
 * action points here, so this must read as deliberate rather than broken.
 */
export function CreatePlaceholderPage() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-primary">Coming soon</p>
      <h1 className="text-2xl font-medium tracking-tight">The receipt builder is next</h1>
      <p className="max-w-prose text-balance text-muted-foreground">
        This is where you will fill in your details, add your items, and export the
        finished receipt.
      </p>
      <Link
        className="text-sm text-primary underline-offset-4 hover:underline"
        to="/"
      >
        Back to home
      </Link>
    </main>
  )
}
