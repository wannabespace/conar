import type { DatabaseType } from '@connnect/shared/enums/database-type'

export function setSql(schema: string, table: string, name: string, where: string[]): Record<DatabaseType, string> {
  return {
    postgres: `
      UPDATE "${schema}"."${table}"
      SET "${name}" = $1
      WHERE ${where.map((column, index) => `"${column}" = $${index + 2}`).join(' AND ')}
    `,
  }
}
