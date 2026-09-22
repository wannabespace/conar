import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind, ConstraintTarget } from './shape'
import { dropConstraint, mysqlDropKey } from './shape'

export const dropConstraintQuery = ({
  cascade,
  kind,
  name,
  schema,
  table,
}: ConstraintTarget & { cascade: boolean; kind: ConstraintKind }) => {
  const target = { name, schema, table }

  return createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) => dropConstraint(db, target).execute(),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP ${mysqlDropKey(kind, name)}`.execute(
          db
        ),
      postgres: (db) => {
        const drop = dropConstraint(db, target)
        return (cascade ? drop.cascade() : drop).execute()
      },
    },
  })
}
