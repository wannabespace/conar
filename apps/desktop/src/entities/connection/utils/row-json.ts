import type { Column } from '../components/table/utils'

export interface TypedRowField {
  type: string
  name: string
  value: unknown
}

export type TypedRow = TypedRowField[]

function parsePostgresArrayLiteral(value: string) {
  if (!value.startsWith('{') || !value.endsWith('}'))
    return null

  const body = value.slice(1, -1)

  if (body === '')
    return []

  const result: (string | null)[] = []
  let current = ''
  let inQuotes = false
  let isEscaped = false
  let tokenWasQuoted = false

  for (let i = 0; i < body.length; i++) {
    const char = body[i]!

    if (isEscaped) {
      current += char
      isEscaped = false
      continue
    }

    if (char === '\\') {
      isEscaped = true
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      tokenWasQuoted = true
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(!tokenWasQuoted && current === 'NULL' ? null : current)
      current = ''
      tokenWasQuoted = false
      continue
    }

    current += char
  }

  result.push(!tokenWasQuoted && current === 'NULL' ? null : current)

  return result
}

function normalizeDateAndBigint(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeDateAndBigint(item))
  }

  return value
}

function normalizeValue(value: unknown, column?: Column) {
  if (value === undefined) {
    return null
  }

  let normalized = value

  if (column?.isArray && typeof normalized === 'string') {
    const original = normalized

    try {
      const parsedJson = JSON.parse(original)

      if (Array.isArray(parsedJson)) {
        normalized = parsedJson
      }
      else {
        const parsedLiteral = parsePostgresArrayLiteral(original)
        if (parsedLiteral !== null) {
          normalized = parsedLiteral
        }
      }
    }
    catch {
      const parsedLiteral = parsePostgresArrayLiteral(original)
      if (parsedLiteral !== null) {
        normalized = parsedLiteral
      }
    }
  }

  return normalizeDateAndBigint(normalized)
}

export function rowToTypedJson(row: Record<string, unknown>, columns: Column[]): TypedRow {
  return columns.map(column => ({
    type: column.type,
    name: column.id,
    value: normalizeValue(row[column.id], column),
  }))
}
