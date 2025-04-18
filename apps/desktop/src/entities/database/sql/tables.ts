import type { DatabaseType } from '@connnect/shared/enums/database-type'

export function tablesSql(schema: string): Record<DatabaseType, string> {
  return {
    postgres: `
      SELECT
        table_name as name,
        table_schema as schema
      FROM information_schema.tables
      WHERE table_schema = '${schema}'
      ORDER BY table_name ASC;
    `,
  }
}
