import type { WhereFilter } from '@conar/shared/sql/where'
import type { databases } from '~/drizzle'
import { sessionStorageValue, useSessionStorage } from '@conar/ui/hookas/use-session-storage'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { databaseRowsQuery } from '~/entities/database'

interface LastOpenedTable {
  schema: string
  table: string
}

function getLastOpenedTableKey(databaseId: string) {
  return `last-opened-table-${databaseId}`
}

export function useLastOpenedTable(id: string) {
  return useSessionStorage<LastOpenedTable | null>(getLastOpenedTableKey(id), null)
}

export function lastOpenedTable(id: string) {
  return sessionStorageValue<LastOpenedTable | null>(getLastOpenedTableKey(id), null)
}

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
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 160],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 150],
  ['uuid', 290],
])
