import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintShape } from './shape'
import { addConstraint, constraintClause } from './shape'

export const createConstraintQuery = ({
  schema,
  shape,
  table,
}: {
  schema: string
  shape: ConstraintShape
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} ADD ${constraintClause(shape)}`.execute(
          db
        ),
      mssql: (db) => addConstraint(db, { schema, table }, shape).execute(),
      mysql: (db) => addConstraint(db, { schema, table }, shape).execute(),
      postgres: (db) => addConstraint(db, { schema, table }, shape).execute(),
    },
  })
