import type { WhereFilter } from '@conar/shared/sql/where'
import type { databases } from '~/drizzle'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { databaseRowsQuery } from '~/entities/database'

export function getRowsQueryOpts({
  database,
  table,
  schema,
  query,
}: {
  database: typeof databases.$inferSelect
  table: string
  schema: string
  query: {
    filters: WhereFilter[]
    orderBy: Record<string, 'ASC' | 'DESC'>
  }
}) {
  return infiniteQueryOptions({
    ...databaseRowsQuery({ database, table, schema, query }),
    throwOnError: false,
  })
}

export const selectSymbol = Symbol('table-selection')

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 160],
  ['number', 180],
  ['integer', 150],
  ['bigint', 190],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 180],
  ['uuid', 320],
])
