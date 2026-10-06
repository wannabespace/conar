import type { ActiveFilter } from '@tamery/shared/filters'
import { EQUAL_FILTER } from '@tamery/shared/filters'
import type { GridRow } from '@tamery/table'

import type { Column } from '~/core/table/cell/utils'

export interface RowsHop {
  column: string
  kind: 'rows'
  schema: string
  table: string
  value: unknown
}

export type Hop =
  | RowsHop
  | {
      kind: 'record'
      primaryKeys: string[]
      row: GridRow
      schema: string
      table: string
    }
  | {
      kind: 'references'
      references: NonNullable<Column['references']>
      value: unknown
    }

export const followReference = (
  { column, schema, table }: { column: string; schema: string; table: string },
  value: unknown
): Hop => ({ column, kind: 'rows', schema, table, value })

/** What Space or Show References opens on a cell: the row it points to, else the rows pointing at it. */
export const cellHop = (column: Column, value: unknown): Hop | null => {
  if (value === null || value === undefined) {
    return null
  }
  if (column.foreign) {
    return followReference(column.foreign, value)
  }
  return column.references?.length
    ? { kind: 'references', references: column.references, value }
    : null
}

const matchFilters = ({ column, value }: RowsHop): ActiveFilter[] => [
  { column, ref: EQUAL_FILTER, values: [value] },
]

export const tableView = (
  hop: Hop
): { filters: ActiveFilter[]; schema: string; table: string } | null => {
  if (hop.kind === 'rows') {
    return { filters: matchFilters(hop), schema: hop.schema, table: hop.table }
  }
  if (hop.kind === 'record' && hop.primaryKeys.length > 0) {
    return {
      filters: hop.primaryKeys.map((column) => ({
        column,
        ref: EQUAL_FILTER,
        values: [hop.row[column]],
      })),
      schema: hop.schema,
      table: hop.table,
    }
  }
  return null
}
