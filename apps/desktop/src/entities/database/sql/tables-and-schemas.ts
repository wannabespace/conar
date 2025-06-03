import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const tableAndSchemaType = type({
  name: 'string',
  schema: 'string',
})

export function tablesAndSchemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        n.nspname AS schema,
        c.relname AS name
      FROM
        pg_catalog.pg_class c
      JOIN
        pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE
        n.nspname NOT LIKE 'pg_temp%'
        AND n.nspname NOT LIKE 'pg_toast_temp%'
        AND n.nspname NOT LIKE 'temp%'
        AND n.nspname NOT IN ('information_schema', 'performance_schema', 'pg_toast', 'pg_catalog')
        AND c.relkind = 'r'
      ORDER BY
        n.nspname,
        c.relname;
    `),
  }
}
