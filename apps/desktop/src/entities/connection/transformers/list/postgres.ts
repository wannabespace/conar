import type { ValueTransformer } from '../'
import { tryParseToJsonArray } from '@conar/shared/utils/helpers'
import { getValueForEditor } from '../base'
import { parseToArray } from './shared'

const PG_ARRAY_LITERAL_RE = /^\{.*\}$/
// quoted element (handles \" and \\) OR bare element up to next comma
const PG_ARRAY_ELEMENT_RE = /"(?:[^"\\]|\\.)*"|[^,]+/g
// \" → " , \\ → \
const PG_UNESCAPE_RE = /\\(.)/g
const PG_NEEDS_QUOTING_RE = /[{},"\\\s]/
const BACKSLASH_RE = /\\/g
const DOUBLE_QUOTE_RE = /"/g

function parsePgArrayLiteral(value: string): string[] | undefined {
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

export function createPostgresListTransformer(): ValueTransformer {
  return {
    toEditable(value: unknown): string {
      return getValueForEditor(parseToArray(value, parsePgArrayLiteral))
    },
    toDb(editedValue: string): string {
      return toPgArrayLiteral(tryParseToJsonArray(editedValue))
    },
  }
}
