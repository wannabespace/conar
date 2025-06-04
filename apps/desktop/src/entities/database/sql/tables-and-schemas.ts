import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const tableAndSchemaType = type({
  table: 'string',
  schema: 'string',
})

export function tablesAndSchemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        table_name as table,
        table_schema as schema
      FROM information_schema.tables
      WHERE table_schema NOT LIKE 'pg_temp%'
        AND table_schema NOT LIKE 'pg_toast_temp%'
        AND table_schema NOT LIKE 'temp%'
        AND table_schema NOT IN ('information_schema', 'performance_schema', 'pg_toast', 'pg_catalog')
      ORDER BY table_schema ASC, table_name ASC;
    `),
  }
}
