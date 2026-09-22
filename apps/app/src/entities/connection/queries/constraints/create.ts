import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
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
}) => {
  const add = sql`ALTER TABLE ${sql.id(schema, table)} ADD ${constraintClause(shape)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) => add.execute(db),
      mysql: (db) => add.execute(db),
      postgres: (db) => add.execute(db),
    },
  })
}
