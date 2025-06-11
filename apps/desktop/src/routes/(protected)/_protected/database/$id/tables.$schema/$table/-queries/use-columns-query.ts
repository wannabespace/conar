import type { Database } from '~/lib/indexeddb'
import { useQuery } from '@tanstack/react-query'
import { databaseColumnsQuery } from '~/entities/database'
import { usePrimaryKeysQuery } from './use-primary-keys-query'

export function useColumnsQuery(database: Database, table: string, schema: string) {
  const { data: primaryKeys } = usePrimaryKeysQuery(database, table, schema)

  return useQuery({
    ...databaseColumnsQuery(database, table, schema),
    select: data => data.map(column => ({
      ...column,
      isPrimaryKey: !!primaryKeys?.includes(column.name),
    })).sort((a, b) => {
      if (a.isPrimaryKey && !b.isPrimaryKey)
        return -1
      if (!a.isPrimaryKey && b.isPrimaryKey)
        return 1
      return a.name.localeCompare(b.name)
    }),
  })
}
