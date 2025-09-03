import type { databases } from '~/drizzle'
import { primaryKeysSql, primaryKeyType } from '@conar/shared/sql/primary-keys'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function databasePrimaryKeysQuery({ database }: { database: typeof databases.$inferSelect }) {
  return queryOptions({
    queryKey: ['database', database.id, 'primaryKeys'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: primaryKeysSql()[database.type],
      })

      return result.rows.map(row => primaryKeyType.assert(row))
    },
  })
}

export function useDatabasePrimaryKeys(...params: Parameters<typeof databasePrimaryKeysQuery>) {
  return useQuery(databasePrimaryKeysQuery(...params))
}
