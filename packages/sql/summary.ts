import { AI_SQL_LIMITS } from '@tamery/shared/constants'

import type { SqlCatalog } from './catalog'

/**
 * One line per table (`schema.table(col type, …)`), the shape a model reads best, cut to what the AI
 * routes accept. Tables whose columns are loaded are the ones in use, so they go first.
 */
export const catalogSummary = (catalog: SqlCatalog) => {
  const tables = catalog.schemas.flatMap((schema) =>
    schema.tables.map((table) => ({
      line: `${schema.name}.${table.name}${table.columns ? `(${table.columns.map((column) => `${column.name} ${column.type}`).join(', ')})` : ''}`,
      loaded: table.columns !== null,
    }))
  )
  const lines = [
    ...tables.filter((table) => table.loaded).map((table) => table.line),
    ...tables.filter((table) => !table.loaded).map((table) => table.line),
    ...catalog.enums.map(
      (item) => `enum ${item.name}: ${item.values.join(', ')}`
    ),
  ]
  const kept: string[] = []
  let length = 0
  for (const line of lines) {
    length += line.length + 1
    if (length > AI_SQL_LIMITS.context) {
      break
    }
    kept.push(line)
  }
  return kept.join('\n')
}
