/** Zero-pads a non-negative integer to `width` digits. */
export function pad(value: number, width: number) {
  return String(value).padStart(width, '0')
}
