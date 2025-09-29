import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

const constraintType = type('"PRIMARY KEY" | "FOREIGN KEY" | "UNIQUE"')

const constraintTypeMap = {
  'PRIMARY KEY': 'primaryKey',
  'FOREIGN KEY': 'foreignKey',
  'UNIQUE': 'unique',
} as const satisfies Record<typeof constraintType.infer, string>

export const constraintsType = type({
  constraint_name: 'string',
  constraint_type: constraintType,
  column_name: 'string | null',
  foreign_table_name: 'string | null',
  foreign_column_name: 'string | null',
}).pipe(item => ({
  name: item.constraint_name,
  type: constraintTypeMap[item.constraint_type],
  column: item.column_name,
  foreignTable: item.constraint_type === 'FOREIGN KEY' ? item.foreign_table_name : null,
  foreignColumn: item.constraint_type === 'FOREIGN KEY' ? item.foreign_column_name : null,
}))

export function constraintsSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        tc."constraint_name",
        tc."constraint_type",
        kcu."column_name",
        ccu."table_name" AS "foreign_table_name",
        ccu."column_name" AS "foreign_column_name"
      FROM "information_schema"."table_constraints" tc
      LEFT JOIN "information_schema"."key_column_usage" kcu
        ON tc."constraint_name" = kcu."constraint_name"
        AND tc."table_schema" = kcu."table_schema"
        AND tc."table_name" = kcu."table_name"
      LEFT JOIN "information_schema"."constraint_column_usage" ccu
        ON tc."constraint_name" = ccu."constraint_name"
        AND tc."constraint_schema" = ccu."constraint_schema"
      WHERE tc."table_schema" = '${schema}'
        AND tc."table_name" = '${table}'
        AND tc."constraint_type" <> 'CHECK'
      ORDER BY tc."table_schema", tc."table_name", kcu."ordinal_position";
    `),
  }
}
