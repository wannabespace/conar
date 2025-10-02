import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

const constraintType = type('"PRIMARY KEY" | "UNIQUE"')

const constraintTypeMap = {
  'PRIMARY KEY': 'primaryKey',
  'UNIQUE': 'unique',
} as const satisfies Record<typeof constraintType.infer, string>

export const constraintsType = type({
  table_schema: 'string',
  table_name: 'string',
  constraint_name: 'string',
  constraint_type: constraintType,
  column_name: 'string | null',
}).pipe(item => ({
  schema: item.table_schema,
  table: item.table_name,
  name: item.constraint_name,
  type: constraintTypeMap[item.constraint_type],
  column: item.column_name,
}))

export function constraintsSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        tc."table_schema",
        tc."table_name",
        tc."constraint_name",
        tc."constraint_type",
        kcu."column_name"
      FROM "information_schema"."table_constraints" tc
      LEFT JOIN "information_schema"."key_column_usage" kcu
        ON tc."constraint_name" = kcu."constraint_name"
        AND tc."table_schema" = kcu."table_schema"
        AND tc."table_name" = kcu."table_name"
      WHERE tc."table_schema" = '${schema}'
        AND tc."table_name" = '${table}'
        AND tc."constraint_type" IN ('PRIMARY KEY', 'UNIQUE')
      ORDER BY tc."table_schema", tc."table_name", kcu."ordinal_position";
    `),
  }
}
