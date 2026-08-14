import type { Filter } from './types'

export const cellToFilterValues = (
  filter: Filter,
  cellValue: unknown
): string[] => {
  if (filter.hasValue === false) {
    return ['']
  }

  let raw = ''
  if (cellValue === null) {
    raw = ''
  } else if (typeof cellValue === 'object') {
    raw = JSON.stringify(cellValue)
  } else {
    raw = String(cellValue)
  }

  if (filter.isArray) {
    return raw === '' ? [''] : [raw]
  }

  if (filter.operator.includes('LIKE')) {
    if (raw === '') {
      return ['%']
    }
    const escaped = raw
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_')
    return [`%${escaped}%`]
  }

  return [raw]
}
