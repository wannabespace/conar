import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind, ConstraintTarget } from './shape'
import { mysqlDropKey } from './shape'

export const dropConstraintQuery = ({
  cascade,
  kind,
  name,
  schema,
  table,
}: ConstraintTarget & { cascade: boolean; kind: ConstraintKind }) => {
  const target = sql.id(schema, table)
  const drop = sql`ALTER TABLE ${target} DROP CONSTRAINT ${sql.id(name)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) => drop.execute(db),
      mysql: (db) =>
        sql`ALTER TABLE ${target} DROP ${mysqlDropKey(kind, name)}`.execute(db),
      postgres: (db) => (cascade ? sql`${drop} CASCADE` : drop).execute(db),
    },
  })
}
