import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const columnType = type({
  table: 'string',
  name: 'string',
  type: 'string',
  editable: 'boolean',
  default: 'string | null',
  nullable: 'boolean',
}).pipe(({ editable, nullable, ...rest }) => ({
  ...rest,
  isEditable: editable,
  isNullable: nullable,
}))

export function columnsSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        c.table_name AS table,
        c.column_name AS name,
        c.column_default AS default,
        CASE
          WHEN "data_type" = 'ARRAY' THEN
            REPLACE("udt_name", '_', '') || '[]'
          WHEN "data_type" = 'USER-DEFINED' THEN
            "udt_name"
          WHEN "data_type" = 'character varying' THEN
            'varchar'
          WHEN "data_type" = 'character' THEN
            'char'
          WHEN "data_type" = 'bit varying' THEN
            'varbit'
          WHEN "data_type" LIKE 'time%' THEN
            "udt_name"
          ELSE
            COALESCE("data_type", "udt_name")
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
