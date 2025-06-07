import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'
import { primaryKeysSql, primaryKeyType } from '../sql/primary-keys'

export function databasePrimaryKeysQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'primaryKeys'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: primaryKeysSql()[database.type],
      })

      return result.rows.map(row => primaryKeyType.assert(row)).map(row => ({
        ...row,
        primaryKeys: row.primary_keys.split(',').map(key => key.trim()),
      }))
    },
  })
}

export function useDatabasePrimaryKeys(...params: Parameters<typeof databasePrimaryKeysQuery>) {
  return useQuery(databasePrimaryKeysQuery(...params))
}
