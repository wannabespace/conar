import type { Column } from '../../components'
import type { ValueTransformer } from '../create-transformer'
import { getDisplayValue } from '../create-transformer'
import { parseToArray } from './shared'

const PG_ARRAY_LITERAL_RE = /^\{.*\}$/
// quoted element (handles \" and \\) OR bare element up to next comma
const PG_ARRAY_ELEMENT_RE = /"(?:[^"\\]|\\.)*"|[^,]+/g
// \" → " , \\ → \
const PG_UNESCAPE_RE = /\\(.)/g
const PG_NEEDS_QUOTING_RE = /[{},"\\\s]/
const BACKSLASH_RE = /\\/g
const DOUBLE_QUOTE_RE = /"/g

export function parsePgArrayLiteral(value: string): string[] | undefined {
  if (!PG_ARRAY_LITERAL_RE.test(value))
    return undefined

  const inner = value.slice(1, -1)
  if (inner === '')
    return []

  return Array.from(inner.matchAll(PG_ARRAY_ELEMENT_RE), ([m]) =>
    m[0] === '"'
      ? m.slice(1, -1).replace(PG_UNESCAPE_RE, '$1')
      : m.trim())
}

export function toPgArrayLiteral(items: string[], separator = ','): string {
  const escaped = items.map((item) => {
    if (item === '')
      return '""'

    if (PG_NEEDS_QUOTING_RE.test(item) || item.toUpperCase() === 'NULL') {
      const quoted = item.replace(BACKSLASH_RE, '\\\\').replace(DOUBLE_QUOTE_RE, '\\"')
      return `"${quoted}"`
    }

    return item
  })

  return `{${escaped.join(separator)}}`
}

// Possible values: null, string[], string {enum1,enum2}
export function createPostgresListTransformer(column: Column): ValueTransformer<string[]> {
  const isEnum = !!column.enumName && !!column.availableValues
  return {
    toDisplay: getDisplayValue,
    fromConnection: value => ({
      toUI: () => {
        if (isEnum && typeof value === 'string')
          return parseToArray(value, parsePgArrayLiteral)

        return []
      },
      toRaw: () => isEnum && typeof value === 'string'
        ? value
        : value === null
          ? ''
          : JSON.stringify(value),
    }),
    toConnection: {
      fromUI: (value) => {
        if (isEnum)
          return toPgArrayLiteral(value)

        // Only enums can have a UI
        throw new Error('Invalid array value')
      },
      fromRaw: (value) => {
        if (isEnum)
          return value

        if (Array.isArray(value))
          return value.map(String)

        if (value === 'null') {
          throw new Error('Press set null button to clear the value')
        }

        if (typeof value === 'string') {
          try {
            return JSON.parse(value)
          }
          catch {
            throw new Error('Invalid JSON array format')
          }
        }

        throw new Error('Invalid array value')
      },
    },
  }
}
