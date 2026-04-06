/**
 * Shared helpers for value transformers.
 * Extracted from the original `getDisplayValue` logic in cell/utils.ts.
 */

/** Convert any value to a truncated display string for a cell. */
export function displayValue(value: unknown, maxWidth: number): string {
  return truncateForDisplay(valueToDisplayString(value), maxWidth)
}

/** Convert any value to a human-readable string for display. */
export function valueToDisplayString(value: unknown): string {
  if (value === null)
    return 'null'

  if (value === '')
    return 'empty'

  if (typeof value === 'object')
    return JSON.stringify(value)

  return String(value)
}

/**
 * Truncate a display string to fit within a cell of the given pixel width.
 *
 * Uses 6px per character as a rough monospace estimate,
 * plus a small buffer for the ellipsis and resize affordance.
 */
export function truncateForDisplay(display: string, maxWidth: number): string {
  const maxChars = (maxWidth / 6) + 5 + 50
  return display.replaceAll('\n', ' ').slice(0, maxChars)
}

export function prepareValueForEditor(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (value instanceof Date)
    return value.toISOString()
  if (typeof value === 'string')
    return value
  return JSON.stringify(value, null, 2)
}
