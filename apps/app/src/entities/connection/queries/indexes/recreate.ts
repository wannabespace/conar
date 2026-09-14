import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { identifiers } from '../shared/sql-fragments'
import { unsupported } from '../shared/unsupported'

const uniqueKeyword = (unique: boolean) => (unique ? sql`UNIQUE ` : sql``)

// Columns and uniqueness are fixed once an index exists, so a change replaces it.
export const recreateIndexQuery = ({
  columns,
  name,
  newName,
  schema,
  table,
  unique,
}: {
  columns: string[]
  name: string
  newName: string
  schema: string
  table: string
  unique: boolean
}) => {
  const drop = sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`
  const create = sql`CREATE ${uniqueKeyword(unique)}INDEX ${sql.id(newName)} ON ${sql.id(schema, table)} (${identifiers(columns)})`

  return createQuery({
    query: {
      clickhouse: unsupported('Editing indexes'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.execute(tx)
          await create.execute(tx)
        }),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}, ADD ${uniqueKeyword(unique)}INDEX ${sql.id(newName)} (${identifiers(columns)})`.execute(
          db
        ),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await sql`DROP INDEX ${sql.id(schema, name)}`.execute(tx)
          await create.execute(tx)
        }),
    },
  })
}
