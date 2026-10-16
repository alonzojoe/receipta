/**
 * The preview scale: the document is `page_width` wide and is only ever shrunk to fit its
 * container, never enlarged (criterion 55). Before the container has been measured, 1.
 */
export function preview_scale(container_width: number, page_width: number) {
  if (!Number.isFinite(container_width) || container_width <= 0) return 1
  return Math.min(1, container_width / page_width)
}
