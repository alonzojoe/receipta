import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-medium tracking-tight">Page not found</h1>
      <Link className="text-sm text-primary underline-offset-4 hover:underline" to="/">
        Back to home
      </Link>
    </main>
  )
}
