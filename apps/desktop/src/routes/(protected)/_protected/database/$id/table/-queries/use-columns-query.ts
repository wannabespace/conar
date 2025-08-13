import type { databases } from '~/drizzle'
import { useMemo } from 'react'
import { useDatabaseTableColumns } from '~/entities/database'
import { usePrimaryKeysQuery } from './use-primary-keys-query'

export function useTableColumns({ database, table, schema }: { database: typeof databases.$inferSelect, table: string, schema: string }) {
  const { data: columns } = useDatabaseTableColumns({ database, table, schema })
  const { data: primaryKeys } = usePrimaryKeysQuery({ database, table, schema })

  return useMemo(() => {
    return columns
      ?.map(column => ({
        ...column,
        isPrimaryKey: !!primaryKeys?.includes(column.name),
      }))
      .toSorted((a, b) => {
        if (a.isPrimaryKey && !b.isPrimaryKey)
          return -1
        if (!a.isPrimaryKey && b.isPrimaryKey)
          return 1
        return 0
      }) ?? []
  }, [columns, primaryKeys])
}
