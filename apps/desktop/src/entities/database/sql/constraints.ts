import type { DialectType } from '../utils/types'
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

type MysqlConstraint = DialectType<typeof constraintsType.inferIn, {
  type: typeof neededConstraintTypes[number]
}>

const label = 'Constraints'

export function constraintsSql(database: typeof databases.$inferSelect) {
  return runSql(database, {
    validate: constraintsType.assert,
    query: {
      postgres: ({ qb, execute, log }) => {
        const query = qb
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
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
      mysql: ({ qb, execute, log }) => {
        const query = qb
          .selectFrom('information_schema.TABLE_CONSTRAINTS')
          .leftJoin('information_schema.KEY_COLUMN_USAGE', 'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME', 'information_schema.KEY_COLUMN_USAGE.CONSTRAINT_NAME')
          .select([
            'information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA as schema',
            'information_schema.TABLE_CONSTRAINTS.TABLE_NAME as table',
            'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_NAME as name',
            'information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE as type',
            'information_schema.KEY_COLUMN_USAGE.COLUMN_NAME as column',
            'information_schema.KEY_COLUMN_USAGE.REFERENCED_TABLE_SCHEMA as usage_schema',
            'information_schema.KEY_COLUMN_USAGE.REFERENCED_TABLE_NAME as usage_table',
            'information_schema.KEY_COLUMN_USAGE.REFERENCED_COLUMN_NAME as usage_column',
          ])
          .where('information_schema.TABLE_CONSTRAINTS.CONSTRAINT_TYPE', 'in', neededConstraintTypes)
          .where('information_schema.TABLE_CONSTRAINTS.TABLE_SCHEMA', 'not in', ['mysql', 'information_schema', 'performance_schema', 'sys'])
          .$assertType<MysqlConstraint>()
          .compile()

        const promise = execute(query)

        log({ ...query, promise, label })

        return promise
      },
    },
  })
}
