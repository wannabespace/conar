import type { DatabaseType } from '@connnect/shared/enums/database-type'
import type { PageSize } from '..'

export function rowsSql(schema: string, table: string, query: {
  limit: PageSize
  page: number
  orderBy?: string
}): Record<DatabaseType, string> {
  return {
    postgres: `
      SELECT *
      FROM "${schema}"."${table}"
      ${query.orderBy ? `ORDER BY ${query.orderBy} ASC` : ''}
      LIMIT ${query.limit}
      OFFSET ${(query.page - 1) * query.limit}
    `,
  }
}
