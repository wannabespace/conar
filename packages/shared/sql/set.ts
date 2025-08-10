import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function setSql(schema: string, table: string, name: string, where: string[]): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      UPDATE "${schema}"."${table}"
      SET "${name}" = $1
      WHERE ${where.map((column, index) => `"${column}" = $${index + 2}`).join(' AND ')}
      RETURNING "${name}"
    `),
  }
}
