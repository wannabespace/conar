import type { Filter } from './types'

function stringify(value: unknown): string {
  if (value === null || value === undefined)
    return ''
  if (typeof value === 'object')
    return JSON.stringify(value)
  return String(value)
}

function escapeLike(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

function isLikeOperator(op: string): boolean {
  return op === 'LIKE' || op === 'ILIKE' || op === 'NOT LIKE'
}

export function cellToFilterValues(filter: Filter, cellValue: unknown): string[] {
  if (filter.hasValue === false)
    return ['']

  const raw = stringify(cellValue)

  if (filter.isArray)
    return raw === '' ? [''] : [raw]

  if (isLikeOperator(filter.operator))
    return raw === '' ? ['%'] : [`%${escapeLike(raw)}%`]

  return [raw]
}

function quoteSql(s: string): string {
  return `'${s.replaceAll('\'', '\'\'')}'`
}

export function formatFilterPreview(filter: Filter, cellValue: unknown): string | null {
  if (filter.hasValue === false)
    return null

  const raw = stringify(cellValue)

  if (filter.isArray)
    return raw === '' ? '()' : `(${quoteSql(raw)})`

  if (isLikeOperator(filter.operator)) {
    if (raw === '')
      return `'%'`
    return `'%${escapeLike(raw).replaceAll('\'', '\'\'')}%'`
  }

  return quoteSql(raw)
}
