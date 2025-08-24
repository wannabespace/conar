import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const tablesAndSchemasType = type({
  schemas: type({
    name: 'string',
    tables: 'string[]',
  }).array().or('null').pipe(data => data ?? []),
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
      ) AS tables_and_schemas;
    `),
  }
}
