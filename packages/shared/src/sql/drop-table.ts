import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function dropTableSql(schema: string, table: string, cascade = false): Record<DatabaseType, string> {
  const cascadeClause = cascade ? ' CASCADE' : ''
  return {
    postgres: prepareSql(`DROP TABLE "${schema}"."${table}"${cascadeClause}`),
  }
}
