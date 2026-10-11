import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class names, resolving conflicts so the last class wins.
 * `clsx` flattens conditionals and arrays, `twMerge` dedupes colliding utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
