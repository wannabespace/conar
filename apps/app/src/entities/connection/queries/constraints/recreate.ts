import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind, ConstraintShape, ConstraintTarget } from './shape'
import { constraintClause, mysqlDropKey } from './shape'

export const recreateConstraintQuery = ({
  kind,
  name,
  schema,
  shape,
  table,
}: ConstraintTarget & { kind: ConstraintKind; shape: ConstraintShape }) => {
  const target = sql.id(schema, table)
  const drop = sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}`
  const add = sql`ALTER TABLE ${target} ADD ${constraintClause(shape)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.execute(tx)
          await add.execute(tx)
        }),
      // One ALTER swaps the key, which InnoDB applies atomically.
      mysql: (db) =>
        sql`
          ALTER TABLE ${target}
          DROP ${mysqlDropKey(kind, name)},
          ADD ${constraintClause(shape)}
        `.execute(db),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.execute(tx)
          await add.execute(tx)
        }),
    },
  })
}
