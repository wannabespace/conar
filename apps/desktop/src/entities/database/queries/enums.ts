import type { Database } from '~/lib/indexeddb'
import { enumsSchema, enumsSql } from '@conar/shared/sql/enums'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { dbQuery } from '~/lib/query'

export function databaseEnumsQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: async () => {
      const [result] = await dbQuery({
        type: database.type,
        connectionString: database.connectionString,
        query: enumsSql()[database.type],
      })

      return enumsSchema.parse(result.rows)
    },
  })
}

export function useDatabaseEnums(...params: Parameters<typeof databaseEnumsQuery>) {
  return useQuery(databaseEnumsQuery(...params))
}
