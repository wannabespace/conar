import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { schemasSql, schemaType } from '../sql/schemas'

export function databaseSchemasQuery(database: Database) {
  return queryOptions({
    queryKey: ['database', database.id, 'schemas'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: schemasSql()[database.type],
      })

      return result.rows.map(row => schemaType.assert(row))
    },
  })
}

export function useDatabaseSchemas(database: Database) {
  return useQuery(databaseSchemasQuery(database))
}
