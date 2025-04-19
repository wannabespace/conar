import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { schemasSql, schemaType } from '../sql/schemas'

export function databaseSchemasQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<typeof schemaType.infer[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: schemasSql()[database.type],
      })

      return result.rows.map(row => schemaType.assert(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'schemas'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseSchemas(database: Database) {
  return useQuery(databaseSchemasQuery(database))
}
