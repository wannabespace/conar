import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'

export function deleteRowsSql(table: string, schema: string, primaryKeys: Record<string, unknown>[]): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      DELETE FROM "${schema}"."${table}"
      WHERE ${primaryKeys.map(pks => Object.entries(pks)).map(pks => pks.map(([key, value]) => `"${key}" = '${value}'`).join(' AND ')).map(str => `(${str})`).join(' OR ')}
    `),
  }
}
