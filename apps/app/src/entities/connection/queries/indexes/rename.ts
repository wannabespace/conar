import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

export const renameIndexQuery = ({
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
      clickhouse: unsupported('Renaming indexes'),
      mssql: (db) =>
        sql`EXEC sp_rename ${sql.lit(`${schema}.${table}.${name}`)}, ${sql.lit(newName)}, 'INDEX'`.execute(
          db
        ),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} RENAME INDEX ${sql.id(name)} TO ${sql.id(newName)}`.execute(
          db
        ),
      postgres: (db) =>
        sql`ALTER INDEX ${sql.id(schema, name)} RENAME TO ${sql.id(newName)}`.execute(
          db
        ),
    },
  })
