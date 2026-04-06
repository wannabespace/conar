import type { ValueTransformer } from '../'
import { createBaseListTransformer, parseToArray } from './shared'

const PG_ARRAY_LITERAL_RE = /^\{.*\}$/
const PG_NEEDS_QUOTING_RE = /[{},"\\\s]/
const BACKSLASH_RE = /\\/g
const DOUBLE_QUOTE_RE = /"/g

function parsePgArrayLiteral(value: string): string[] | undefined {
  if (PG_ARRAY_LITERAL_RE.test(value)) {
    const inner = value.slice(1, -1)
    return inner === '' ? [] : inner.split(',').map(v => v.trim())
  }
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
  return createBaseListTransformer({
    parseFromDb: value => parseToArray(value, parsePgArrayLiteral),
    toDbFormat: toPgArrayLiteral,
  })
}
