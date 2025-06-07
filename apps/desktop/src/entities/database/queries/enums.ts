import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'
import { enumsSql, enumType } from '../sql/enums'

export function databaseEnumsQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: enumsSql()[database.type],
      })

      return result.rows.map(row => enumType.assert(row))
    },
  })
}

export function useDatabaseEnums(...params: Parameters<typeof databaseEnumsQuery>) {
  return useQuery(databaseEnumsQuery(...params))
}
