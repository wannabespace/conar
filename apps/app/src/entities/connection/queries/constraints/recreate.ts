import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind, ConstraintShape, ConstraintTarget } from './shape'
import {
  addConstraint,
  constraintClause,
  dropConstraint,
  mysqlDropKey,
} from './shape'

export const recreateConstraintQuery = ({
  kind,
  name,
  schema,
  shape,
  table,
}: ConstraintTarget & { kind: ConstraintKind; shape: ConstraintShape }) => {
  const target = { name, schema, table }

  return createQuery({
    query: {
      clickhouse: (db) =>
        sql`
          ALTER TABLE ${sql.id(schema, table)}
          DROP ${mysqlDropKey(kind, name)},
          ADD ${constraintClause(shape)}
        `.execute(db),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await dropConstraint(tx, target).execute()
          await addConstraint(tx, target, shape).execute()
        }),
      // One ALTER swaps the key, which InnoDB applies atomically.
      mysql: (db) =>
        sql`
          ALTER TABLE ${sql.id(schema, table)}
          DROP ${mysqlDropKey(kind, name)},
          ADD ${constraintClause(shape)}
        `.execute(db),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await dropConstraint(tx, target).execute()
          await addConstraint(tx, target, shape).execute()
        }),
    },
  })
}
