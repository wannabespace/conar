import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const countType = type({
  total: 'string.numeric',
})

export function totalSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        COUNT(*) AS total
      FROM
        "${schema}"."${table}";
    `),
  }
}
