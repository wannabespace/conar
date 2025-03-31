import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

export function databasePrimaryKeysQuery(database: Database) {
  const primaryKeySchema = z.object({
    table: z.string(),
    schema: z.string(),
    primary_key: z.string(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof primaryKeySchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT
            tc.table_name as table,
            tc.table_schema as schema,
            kcu.column_name AS primary_key
          FROM
            information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema NOT LIKE 'pg_temp%'
            AND tc.table_schema NOT LIKE 'pg_toast_temp%'
            AND tc.table_schema NOT LIKE 'temp%'
            AND tc.table_schema NOT IN ('information_schema', 'performance_schema')
          ORDER BY
            kcu.ordinal_position;
        `,
      })

      return result.rows.map(row => primaryKeySchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'primaryKeys'],
    queryFn: () => queryMap[database.type](),
    select: (data) => {
      const primaryKeysMap: Record<string, { table: string, schema: string, primaryKey: string[] }> = {}

      data.forEach((row) => {
        const key = `${row.schema}.${row.table}`

        primaryKeysMap[key] ||= {
          table: row.table,
          schema: row.schema,
          primaryKey: [row.primary_key],
        }

        primaryKeysMap[key].primaryKey.push(row.primary_key)
      })

      return Object.values(primaryKeysMap)
    },
  })
}

export function useDatabasePrimaryKeys(database: Database) {
  return useQuery(databasePrimaryKeysQuery(database))
}
