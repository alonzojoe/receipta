/** CRLF and lone CR become LF, then the value is trimmed. What is counted and stored. */
export function normalise_notes(value: string) {
  return value.replace(/\r\n?/g, '\n').trim()
}
