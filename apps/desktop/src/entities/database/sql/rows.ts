import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '../table'
import { prepareSql } from '@connnect/shared/utils/helpers'

export function rowsSql(schema: string, table: string, query: {
  limit: PageSize
  page: number
  orderBy?: [string, 'ASC' | 'DESC']
  where?: string
}): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT *
      FROM "${schema}"."${table}"
      ${query.where ? `WHERE ${query.where}` : ''}
      ${query.orderBy ? `ORDER BY "${query.orderBy[0]}" ${query.orderBy[1]}` : ''}
      LIMIT ${query.limit}
      OFFSET ${(query.page - 1) * query.limit}
    `),
  }
}
