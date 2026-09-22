import { sql } from 'kysely'

import { sqlEngines, statementQuery } from '../shared/statements'
import type { ConstraintShape } from './shape'
import { constraintClause } from './shape'

export const createConstraintQuery = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: ConstraintShape
  table: string
}) =>
  statementQuery(
    'Constraints',
    sqlEngines(
      sql`ALTER TABLE ${sql.id(schema, table)} ADD ${constraintClause(shape)}`
    )
  )
