import type { databases } from '~/drizzle'
import { constraintColumnUsage, constraints, keyColumnUsage } from '@conar/shared/schemas/postgres/information'
import { type } from 'arktype'
import { and, eq, inArray, like, not } from 'drizzle-orm'
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
  usageSchema: 'string | null',
  usageTable: 'string | null',
  usageColumn: 'string | null',
  name: 'string',
  type: constraintType,
  column: 'string | null',
}).pipe(item => ({
  ...item,
  type: constraintTypeLabelMap[item.type as typeof neededConstraintTypes[number]],
}))

export function constraintsSql(database: typeof databases.$inferSelect) {
  return runSql({
    type: constraintsType,
    database,
    label: 'Constraints',
    query: ({ db }) => db
      .select({
        schema: constraints.table_schema,
        table: constraints.table_name,
        name: constraints.constraint_name,
        type: constraints.constraint_type,
        column: keyColumnUsage.column_name,
        usageSchema: constraintColumnUsage.table_schema,
        usageTable: constraintColumnUsage.table_name,
        usageColumn: constraintColumnUsage.column_name,
      })
      .from(constraints)
      .leftJoin(keyColumnUsage, eq(constraints.constraint_name, keyColumnUsage.constraint_name))
      .leftJoin(constraintColumnUsage, eq(constraints.constraint_name, constraintColumnUsage.constraint_name))
      .where(and(
        inArray(constraints.constraint_type, neededConstraintTypes),
        not(like(constraints.table_schema, 'pg_%')),
      )),
  })
}
