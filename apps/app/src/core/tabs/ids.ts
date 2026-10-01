import type { DefinitionsSection } from '~/core/catalog/sections'

export const tableTabId = (schema: string, table: string) =>
  `table:${encodeURIComponent(schema)}:${encodeURIComponent(table)}`

export const parseTableTabId = (id: string) => {
  const [kind, schema, table, ...extra] = id.split(':')

  return kind === 'table' && schema && table && extra.length === 0
    ? { schema: decodeURIComponent(schema), table: decodeURIComponent(table) }
    : null
}

export const definitionsTabId = (section: DefinitionsSection) =>
  `definitions:${section}`
