import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { enumsSql } from '../sql/enums'

const enumType = type({
  schema: 'string',
  name: 'string',
  value: 'string',
})

export function databaseEnumsQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<typeof enumType.infer[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: enumsSql()[database.type],
      })

      return result.rows.map(row => enumType.assert(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'enums'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseEnums(database: Database) {
  return useQuery(databaseEnumsQuery(database))
}
