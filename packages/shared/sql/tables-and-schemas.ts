import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import * as z from 'zod'

export const tablesAndSchemasSchema = z.object({
  schemas: z.array(z.object({
    name: z.string(),
    tables: z.array(z.string()),
  })).nullable().transform(data => data ?? []),
})

export function tablesAndSchemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT json_build_object(
        'schemas', (
          SELECT json_agg(
            json_build_object(
              'name', name,
              'tables', tables
            )
          )
          FROM (
            SELECT
              s.nspname AS name,
              array_agg(t.relname) AS tables
            FROM pg_catalog.pg_namespace s
            JOIN pg_catalog.pg_class t ON t.relnamespace = s.oid
            WHERE s.nspname NOT IN ('pg_catalog', 'information_schema')
              AND s.nspname NOT LIKE 'pg_toast%'
              AND s.nspname NOT LIKE 'pg_temp%'
              AND t.relkind = 'r'
            GROUP BY s.nspname
          ) sub
        )
      ) AS database_context;
    `),
  }
}
