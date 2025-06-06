import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const totalType = type({
  total: 'string.numeric',
})

export function totalSql(schema: string, table: string, query: {
  where?: string
}): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        COUNT(*) AS total
      FROM
        "${schema}"."${table}"
      ${query.where ? `WHERE ${query.where}` : ''}
    `),
  }
}
