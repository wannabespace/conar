import type { ValueTransformer } from '../types'
import { stringifyForEditor, truncateForDisplay, valueToDisplayString, valueToRawString } from '../base'

const PG_ARRAY_LITERAL_RE = /^\{.*\}$/
const PG_NEEDS_QUOTING_RE = /[{},"\\\s]/
const BACKSLASH_RE = /\\/g
const DOUBLE_QUOTE_RE = /"/g

/**
 * Postgres list transformer.
 *
 * PG driver auto-parses arrays into JS `Array`.
 * When saving back, we convert to PG array literal: {a,b,c}
 * with proper quoting for values containing special characters.
 */
export function createPostgresListTransformer(): ValueTransformer {
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
      return toPgArrayLiteral(items)
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

  // PG array literal {a,b,c}
  if (PG_ARRAY_LITERAL_RE.test(value)) {
    const inner = value.slice(1, -1)
    return inner === '' ? [] : inner.split(',').map(v => v.trim())
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

/**
 * Convert string[] to PG array literal: {a,"b,c","d\"e"}
 * Values containing {, }, comma, double-quote, backslash, or that equal NULL
 * (case-insensitive) need to be double-quoted with internal escaping.
 */
function toPgArrayLiteral(items: string[]): string {
  const escaped = items.map((item) => {
    if (item === '')
      return '""'

    if (PG_NEEDS_QUOTING_RE.test(item) || item.toUpperCase() === 'NULL') {
      const quoted = item.replace(BACKSLASH_RE, '\\\\').replace(DOUBLE_QUOTE_RE, '\\"')
      return `"${quoted}"`
    }

    return item
  })

  return `{${escaped.join(',')}}`
}
