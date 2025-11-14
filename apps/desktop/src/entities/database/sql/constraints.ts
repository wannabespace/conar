import type { databases } from '~/drizzle'
import { type } from 'arktype'
import { runSql } from '../query'

const constraintType = type('"PRIMARY KEY" | "UNIQUE" | "FOREIGN KEY" | "CHECK" | "EXCLUSION"')

const neededConstraintTypes = ['PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY'] as const satisfies typeof constraintType.infer[]

const constraintTypeLabelMap = {
  'PRIMARY KEY': 'primaryKey',
  'UNIQUE': 'unique',
  'FOREIGN KEY': 'foreignKey',
  'CHECK': 'check',
  'EXCLUSION': 'exclusion',
} as const satisfies Record<typeof constraintType.infer, string>

export const constraintsType = type({
  schema: 'string',
  table: 'string',
  usage_schema: 'string | null',
  usage_table: 'string | null',
  usage_column: 'string | null',
  name: 'string',
  type: constraintType,
  column: 'string | null',
})
  .pipe(({ type, usage_column, usage_table, usage_schema, ...item }) => ({
    ...item,
    type: constraintTypeLabelMap[type as typeof neededConstraintTypes[number]],
    usageTable: usage_table,
    usageColumn: usage_column,
    usageSchema: usage_schema,
  }))

export function constraintsSql(database: typeof databases.$inferSelect) {
  return runSql({
    validate: constraintsType.assert,
    database,
    label: 'Constraints',
    query: {
      postgres: db => db
        .selectFrom('information_schema.table_constraints')
        .leftJoin('information_schema.key_column_usage', 'information_schema.table_constraints.constraint_name', 'information_schema.key_column_usage.constraint_name')
        .leftJoin('information_schema.constraint_column_usage', 'information_schema.table_constraints.constraint_name', 'information_schema.constraint_column_usage.constraint_name')
        .select([
          'information_schema.table_constraints.table_schema as schema',
          'information_schema.table_constraints.table_name as table',
          'information_schema.table_constraints.constraint_name as name',
          'information_schema.table_constraints.constraint_type as type',
          'information_schema.key_column_usage.column_name as column',
          'information_schema.constraint_column_usage.table_schema as usage_schema',
          'information_schema.constraint_column_usage.table_name as usage_table',
          'information_schema.constraint_column_usage.column_name as usage_column',
        ])
        .where('information_schema.table_constraints.constraint_type', 'in', neededConstraintTypes)
        .where('information_schema.constraint_column_usage.table_schema', 'not like', 'pg_%')
        .$assertType<typeof constraintsType.inferIn>()
        .compile(),
      mysql: () => {
        throw new Error('Not implemented')
      },
    },
  })
}
