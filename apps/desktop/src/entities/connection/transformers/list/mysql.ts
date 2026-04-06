import type { ValueTransformer } from '../types'
import { stringifyForEditor, truncateForDisplay, valueToDisplayString, valueToRawString } from '../base'

/**
 * MySQL list transformer (for SET type).
 *
 * MySQL SET values arrive as comma-separated strings: "a,b,c"
 * When saving back, we convert to the same comma-separated format.
 */
export function createMysqlListTransformer(): ValueTransformer {
  return {
    toDisplay(value: unknown, maxWidth: number): string {
      return truncateForDisplay(valueToDisplayString(value), maxWidth)
    },

    toEditable(value: unknown): string {
      const items = parseToArray(value)
      return stringifyForEditor(items)
    },

    toDb(editedValue: string): string {
      const items = parseJsonArray(editedValue)
      return items.join(',')
    },

    toRaw(value: unknown): string {
      return valueToRawString(value)
    },

    parseEditableToList(editedValue: string): string[] {
      return parseJsonArray(editedValue)
    },
  }
}

/** Parse any incoming value into a string array. */
function parseToArray(value: unknown): string[] {
  if (value === null || value === undefined || value === '')
    return []

  if (Array.isArray(value))
    return value.map(String)

  if (typeof value !== 'string')
    return [String(value)]

  // Try JSON array
  if (value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed))
        return parsed.map(String)
    }
    catch {}
  }

  // MySQL SET: comma-separated
  if (value.includes(','))
    return value.split(',').map(v => v.trim())

  return [value]
}

/** Parse a JSON array string (from editor) into string[]. */
function parseJsonArray(editedValue: string): string[] {
  try {
    const parsed = JSON.parse(editedValue)
    if (Array.isArray(parsed))
      return parsed.map(String)
  }
  catch {}
  return [editedValue]
}
