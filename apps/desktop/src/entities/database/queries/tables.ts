import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

const tableSchema = z.object({
  name: z.string(),
  schema: z.string(),
})

export function databaseTablesQuery(database: Database, schema: string) {
  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof tableSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT
            table_name as name,
            table_schema as schema
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
          ORDER BY table_name ASC;
        `,
      })

      return result.rows.map(row => tableSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'tables'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseTables(database: Database, schema: string) {
  return useQuery(databaseTablesQuery(database, schema))
}
