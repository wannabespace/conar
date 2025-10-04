import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

const constraintType = type('"PRIMARY KEY" | "UNIQUE" | "FOREIGN KEY"')

const constraintTypeMap = {
  'PRIMARY KEY': 'primaryKey',
  'UNIQUE': 'unique',
  'FOREIGN KEY': 'foreignKey',
} as const satisfies Record<typeof constraintType.infer, string>

export const constraintsType = type({
  table_schema: 'string',
  table_name: 'string',
  usage_table_schema: 'string | null',
  usage_table_name: 'string | null',
  usage_column_name: 'string | null',
  constraint_name: 'string',
  constraint_type: constraintType,
  column_name: 'string | null',
}).pipe(item => ({
  schema: item.table_schema,
  table: item.table_name,
  usageSchema: item.usage_table_schema,
  usageTable: item.usage_table_name,
  usageColumn: item.usage_column_name,
  name: item.constraint_name,
  type: constraintTypeMap[item.constraint_type],
  column: item.column_name,
}))

export function constraintsSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        tc."table_schema",
        tc."table_name",
        tc."constraint_name",
        tc."constraint_type",
        kcu."column_name",
        ccu."table_schema" AS usage_table_schema,
        ccu."table_name" AS usage_table_name,
        ccu."column_name" AS usage_column_name
      FROM "information_schema"."table_constraints" tc
      LEFT JOIN "information_schema"."key_column_usage" kcu
        ON tc."constraint_name" = kcu."constraint_name"
        AND tc."table_schema" = kcu."table_schema"
        AND tc."table_name" = kcu."table_name"
      LEFT JOIN "information_schema"."constraint_column_usage" ccu
        ON tc."constraint_name" = ccu."constraint_name"
        AND tc."table_schema" = ccu."table_schema"
      WHERE tc."constraint_type" IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
        AND tc."table_schema" NOT LIKE 'pg\\_%' ESCAPE '\\';
    `),
  }
}
