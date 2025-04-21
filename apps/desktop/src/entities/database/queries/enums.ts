import type { Database } from '~/lib/indexeddb'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { enumsSql, enumType } from '../sql/enums'

export function databaseEnumsQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: enumsSql()[database.type],
      })

      return result.rows.map(row => enumType.assert(row))
    },
  })
}

export function useDatabaseEnums(database: Database) {
  return useSuspenseQuery(databaseEnumsQuery(database))
}
