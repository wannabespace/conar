import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'

const primaryKeyType = type({
  table: 'string',
  schema: 'string',
  primary_keys: 'string',
})

export function databasePrimaryKeysQuery(database: Database) {
  const queryMap: Record<DatabaseType, () => Promise<{
    table: string
    schema: string
    primaryKeys: string[]
  }[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT DISTINCT
            tc.table_name AS table,
            tc.table_schema AS schema,
            string_agg(kcu.column_name, ',') AS primary_keys
          FROM
            information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema NOT LIKE 'pg_temp%'
            AND tc.table_schema NOT LIKE 'pg_toast_temp%'
            AND tc.table_schema NOT LIKE 'temp%'
            AND tc.constraint_type = 'PRIMARY KEY'
          GROUP BY
            tc.table_name,
            tc.table_schema;
        `,
      })

      return result.rows.map(row => primaryKeyType.assert(row)).map(row => ({
        ...row,
        primaryKeys: row.primary_keys.split(',').map(key => key.trim()),
      }))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, 'primaryKeys'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabasePrimaryKeys(database: Database) {
  return useQuery(databasePrimaryKeysQuery(database))
}
