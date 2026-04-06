import type { ValueTransformer } from '../types'
import { stringifyForEditor, truncateForDisplay, valueToDisplayString, valueToRawString } from '../base'

/**
 * ClickHouse list transformer.
 *
 * ClickHouse uses JSONEachRow format, so arrays arrive as native JS arrays.
 * When saving back, we convert to a JSON array string (which gets inlined
 * into the SQL via `prepareQuery`).
 */
export function createClickHouseListTransformer(): ValueTransformer {
  return {
    toDisplay(value: unknown, maxWidth: number): string {
      return truncateForDisplay(valueToDisplayString(value), maxWidth)
    },

    toEditable(value: unknown): string {
      const items = parseToArray(value)
      return stringifyForEditor(items)
    },

    toDb(editedValue: string): string {
      // ClickHouse expects a JSON-style array: ["a","b","c"]
      const items = parseJsonArray(editedValue)
      return JSON.stringify(items)
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
