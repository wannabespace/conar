import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { primaryKeysSql, primaryKeyType } from '../sql/primary-keys'

export function databasePrimaryKeysQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<{
    table: string
    schema: string
    primaryKeys: string[]
  }[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: primaryKeysSql()[database.type],
      })

      return result.rows.map(row => primaryKeyType.assert(row)).map(row => ({
        ...row,
        primaryKeys: row.primary_keys.split(',').map(key => key.trim()),
      }))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'primaryKeys'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabasePrimaryKeys(database: Database) {
  return useQuery(databasePrimaryKeysQuery(database))
}
