import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const schemaType = type({
  name: 'string',
})

export function schemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT schema_name as name
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_temp%'
        AND schema_name NOT LIKE 'pg_toast_temp%'
        AND schema_name NOT LIKE 'temp%'
        AND schema_name NOT IN ('information_schema', 'performance_schema', 'pg_toast', 'pg_catalog')
      ORDER BY schema_name ASC;
    `),
  }
}
