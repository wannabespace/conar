import type { Database } from '~/lib/indexeddb'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { schemasSql, schemaType } from '../sql/schemas'

export function databaseSchemasQuery(database: Database, hideInternal = true) {
  return queryOptions({
    queryKey: ['database', database.id, 'schemas', hideInternal],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: schemasSql(hideInternal)[database.type],
      })

      return result.rows.map(row => schemaType.assert(row))
    },
    placeholderData: [{
      name: 'public',
    }],
  })
}

export function useDatabaseSchemas(database: Database, hideInternal = true) {
  return useSuspenseQuery(databaseSchemasQuery(database, hideInternal))
}
