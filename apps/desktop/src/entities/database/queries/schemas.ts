import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'

const schemaType = type({
  name: 'string',
})

export function databaseSchemasQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<typeof schemaType.infer[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT schema_name as name
          FROM information_schema.schemata
          WHERE schema_name NOT LIKE 'pg_temp%'
            AND schema_name NOT LIKE 'pg_toast_temp%'
            AND schema_name NOT LIKE 'temp%'
            AND schema_name NOT IN ('information_schema', 'performance_schema', 'pg_toast', 'pg_catalog')
          ORDER BY schema_name ASC;
        `,
      })

      return result.rows.map(row => schemaType(row))
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
