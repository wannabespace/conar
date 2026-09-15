import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { identifiers } from '../shared/sql-fragments'
import { unsupported } from '../shared/unsupported'
import type { IndexShape } from './create'
import { createIndexStatement } from './create'

// Columns and uniqueness are fixed once an index exists, so a change replaces it.
export const recreateIndexQuery = ({
  name,
  newName,
  ...shape
}: IndexShape & { newName: string }) => {
  const { schema, table } = shape
  const create = createIndexStatement({ ...shape, name: newName })

  return createQuery({
    query: {
      clickhouse: unsupported('Editing indexes'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
            tx
          )
          await create.execute(tx)
        }),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}, ADD ${shape.unique ? sql`UNIQUE ` : sql``}INDEX ${sql.id(newName)} (${identifiers(shape.columns)})`.execute(
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
