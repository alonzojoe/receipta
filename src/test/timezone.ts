/**
 * Switches the process time zone for one test and returns the function that restores it.
 * The app's tsconfig does not load Node's types, so `process` is reached through
 * `globalThis` here, in one place, rather than in every test.
 */
type NodeProcess = { env: Record<string, string | undefined> }

export function set_timezone(zone: string) {
  const { env } = (globalThis as unknown as { process: NodeProcess }).process
  const original = env.TZ
  env.TZ = zone
  return () => {
    if (original === undefined) delete env.TZ
    else env.TZ = original
  }
}
