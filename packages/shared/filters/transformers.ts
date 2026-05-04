import type { Filter } from './types'

export function cellToFilterValues(filter: Filter, cellValue: unknown): string[] {
  if (filter.hasValue === false)
    return ['']

  const raw = cellValue === null
    ? ''
    : typeof cellValue === 'object'
      ? JSON.stringify(cellValue)
      : String(cellValue)

  if (filter.isArray)
    return raw === '' ? [''] : [raw]

  if (filter.operator.includes('LIKE')) {
    if (raw === '')
      return ['%']
    const escaped = raw.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
    return [`%${escaped}%`]
  }

  return [raw]
}
