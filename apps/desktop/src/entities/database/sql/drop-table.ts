import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function dropTableSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`DROP TABLE "${schema}"."${table}"`),
  }
}
