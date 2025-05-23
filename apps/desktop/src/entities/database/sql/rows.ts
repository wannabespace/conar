import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '~/components/table'
import { prepareSql } from '@connnect/shared/utils/helpers'

export function rowsSql(schema: string, table: string, query: {
  limit: PageSize
  page: number
  orderBy?: Record<string, 'ASC' | 'DESC'>
  where?: string
}): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT *
      FROM "${schema}"."${table}"
      ${query.where ? `WHERE ${query.where}` : ''}
      ${query.orderBy && Object.keys(query.orderBy).length > 0 ? `ORDER BY ${Object.entries(query.orderBy).map(([column, order]) => `"${column}" ${order}`).join(', ')}` : ''}
      LIMIT ${query.limit}
      OFFSET ${(query.page - 1) * query.limit}
    `),
  }
}
