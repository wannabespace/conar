import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function rowsSql(schema: string, table: string, query: {
  limit: number
  offset: number
  orderBy?: Record<string, 'ASC' | 'DESC'>
  where?: string
  select?: string[]
}): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT ${query.select ? query.select.map(col => `"${col}"`).join(', ') : '*'}
      FROM "${schema}"."${table}"
      ${query.where ? `WHERE ${query.where}` : ''}
      ${query.orderBy && Object.keys(query.orderBy).length > 0 ? `ORDER BY ${Object.entries(query.orderBy).map(([column, order]) => `"${column}" ${order}`).join(', ')}` : ''}
      LIMIT ${query.limit}
      OFFSET ${query.offset}
    `),
  }
}
