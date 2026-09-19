import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { ConstraintKind } from './shape'
import { mysqlDropTarget } from './shape'

export const dropConstraintQuery = ({
  cascade,
  kind,
  name,
  schema,
  table,
}: {
  cascade: boolean
  kind: ConstraintKind
  name: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP CONSTRAINT ${sql.id(name)}`.execute(
          db
        ),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP ${mysqlDropTarget[kind](name)}`.execute(
          db
        ),
      postgres: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP CONSTRAINT ${sql.id(name)}${cascade ? sql` CASCADE` : sql``}`.execute(
          db
        ),
    },
  })
