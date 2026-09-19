import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { mssqlQualified } from '../shared/sql-fragments'

export const renameConstraintQuery = ({
  name,
  newName,
  schema,
  table,
}: {
  name: string
  newName: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Constraints'),
      mssql: (db) =>
        sql`EXEC sp_rename ${sql.lit(mssqlQualified(schema, name))}, ${sql.lit(newName)}, 'OBJECT'`.execute(
          db
        ),
      mysql: unsupported('Renaming constraints'),
      postgres: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} RENAME CONSTRAINT ${sql.id(name)} TO ${sql.id(newName)}`.execute(
          db
        ),
    },
  })
