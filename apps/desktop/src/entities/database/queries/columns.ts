import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { Database } from '~/lib/indexeddb'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

export function databaseColumnsQuery(database: Database, table: string, schema: string) {
  const columnSchema = z.object({
    table: z.string(),
    name: z.string(),
    type: z.string(),
    editable: z.boolean(),
    default: z.string().nullable(),
    nullable: z.boolean(),
  })

  const queryMap: Record<DatabaseType, () => Promise<z.infer<typeof columnSchema>[]>> = {
    postgres: async () => {
      const [result] = await window.electron.databases.query({
        type: database.type,
        connectionString: database.connectionString,
        query: `
          SELECT
            c.table_name AS table,
            c.column_name AS name,
            c.column_default AS default,
            CASE
              WHEN c.data_type = 'USER-DEFINED' THEN (
                SELECT t.typname
                FROM pg_catalog.pg_type t
                JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = c.udt_name
              )
              ELSE c.data_type
            END AS type,
            CASE
              WHEN c.is_nullable = 'YES' THEN true
              ELSE false
            END AS nullable,
            CASE
              WHEN c.is_updatable = 'YES' THEN true
              ELSE false
            END AS editable
          FROM information_schema.columns c
          WHERE c.table_schema = '${schema}'
            AND c.table_name = '${table}'
          ORDER BY c.ordinal_position;
        `,
      })

      return result.rows.map(row => columnSchema.parse(row))
    },
  }

  return queryOptions({
    queryKey: ['database', database.id, schema, 'table', table, 'columns'],
    queryFn: () => queryMap[database.type](),
  })
}

export function useDatabaseColumns(database: Database, table: string, schema: string) {
  return useQuery(databaseColumnsQuery(database, table, schema))
}
