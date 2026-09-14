import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'
import type { ConstraintKind, ConstraintShape } from './shape'
import { constraintClause, mysqlDropTarget } from './shape'

export const recreateConstraintQuery = ({
  kind,
  name,
  schema,
  shape,
  table,
}: {
  kind: ConstraintKind
  name: string
  schema: string
  shape: ConstraintShape
  table: string
}) => {
  const target = sql.id(schema, table)
  const dropConstraint = sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}`
  const addConstraint = sql`ALTER TABLE ${target} ADD ${constraintClause(shape)}`
  // oxlint-disable-next-line ts/no-explicit-any
  const swapInTransaction = (db: Kysely<any>) =>
    db.transaction().execute(async (tx) => {
      await dropConstraint.execute(tx)
      await addConstraint.execute(tx)
    })

  return createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: swapInTransaction,
      mysql: (db) =>
        sql`ALTER TABLE ${target} DROP ${mysqlDropTarget[kind](name)}, ADD ${constraintClause(shape)}`.execute(
          db
        ),
      postgres: swapInTransaction,
    },
  })
}
