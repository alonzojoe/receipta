/**
 * Home page. Composes the marketing widgets in order and owns no logic of its own.
 * Sections are added in the tasks that follow; this is the composition root.
 */
export function HomePage() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-medium tracking-tight">Receipta</h1>
      <p className="max-w-prose text-balance text-muted-foreground">
        Send receipts, not screenshots.
      </p>
    </main>
  )
}
