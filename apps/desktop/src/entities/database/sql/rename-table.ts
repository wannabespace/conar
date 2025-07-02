import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function renameTableSql(schema: string, oldTable: string, newTable: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`ALTER TABLE "${schema}"."${oldTable}" RENAME TO "${newTable}"`),
  }
}
