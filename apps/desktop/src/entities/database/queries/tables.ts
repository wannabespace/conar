import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { tablesSql, tableType } from '../sql/tables'

export function databaseTablesQuery(database: Database, schema: string) {
  return queryOptions({
    queryKey: ['database', database.id, 'schema', schema, 'tables'],
    queryFn: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: tablesSql(schema)[database.type],
      })

      return result.rows.map(row => tableType.assert(row))
    },
  })
}

export function useDatabaseTables(database: Database, schema: string) {
  return useQuery(databaseTablesQuery(database, schema))
}
