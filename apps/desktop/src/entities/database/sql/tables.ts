import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const tableType = type({
  name: 'string',
  schema: 'string',
})

export function tablesSql(schema: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        table_name as name,
        table_schema as schema
      FROM information_schema.tables
      WHERE table_schema = '${schema}'
      ORDER BY table_name ASC;
    `),
  }
}
