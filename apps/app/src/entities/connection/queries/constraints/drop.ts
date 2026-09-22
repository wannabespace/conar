import { sql } from 'kysely'

import { statementQuery } from '../shared/statements'
import type { ConstraintKind, ConstraintTarget } from './shape'
import { mysqlDropTarget } from './shape'

export const dropConstraintQuery = ({
  cascade,
  kind,
  name,
  schema,
  table,
}: ConstraintTarget & { cascade: boolean; kind: ConstraintKind }) => {
  const target = sql.id(schema, table)

  return statementQuery('Constraints', {
    mssql: sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}`,
    mysql: sql`ALTER TABLE ${target} DROP ${mysqlDropTarget[kind](name)}`,
    postgres: sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}${cascade ? sql` CASCADE` : sql``}`,
  })
}
