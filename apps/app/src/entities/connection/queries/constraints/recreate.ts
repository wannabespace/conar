import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { ConstraintKind, ConstraintShape, ConstraintTarget } from './shape'
import { constraintClause, mysqlDropTarget } from './shape'

export const recreateConstraintQuery = ({
  kind,
  name,
  schema,
  shape,
  table,
}: ConstraintTarget & { kind: ConstraintKind; shape: ConstraintShape }) => {
  const target = sql.id(schema, table)
  const swap = [
    sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}`,
    sql`ALTER TABLE ${target} ADD ${constraintClause(shape)}`,
  ]

  return statementQuery('Constraints', {
    mssql: swap,
    // One ALTER drops and adds at once, which InnoDB applies atomically.
    mysql: sql`ALTER TABLE ${target} DROP ${mysqlDropTarget[kind](name)}, ADD ${constraintClause(shape)}`,
    postgres: swap,
  })
}
