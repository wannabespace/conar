import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'
import { type } from 'arktype'

export const columnType = type({
  table: 'string',
  name: 'string',
  type: 'string',
  editable: 'boolean',
  default: 'string | null',
  nullable: 'boolean',
})

export function columnsSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        c.table_name AS table,
        c.column_name AS name,
        c.column_default AS default,
        CASE
          WHEN c.data_type = 'USER-DEFINED' THEN (
            SELECT t.typname
            FROM pg_catalog.pg_type t
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = c.udt_name
          )
          ELSE c.data_type
        END AS type,
        CASE
          WHEN c.is_nullable = 'YES' THEN true
          ELSE false
        END AS nullable,
        CASE
          WHEN c.is_updatable = 'YES' THEN true
          ELSE false
        END AS editable
      FROM information_schema.columns c
      WHERE c.table_schema = '${schema}'
        AND c.table_name = '${table}'
      ORDER BY c.ordinal_position;
    `),
  }
}
