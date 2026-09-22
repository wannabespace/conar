import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { identifiers } from '../shared/sql-fragments'
import type { IndexShape } from './shape'
import { createIndexStatement } from './shape'

export const recreateIndexQuery = ({
  columns,
  name,
  newName,
  schema,
  table,
  unique,
}: IndexShape & { newName: string }) => {
  const create = createIndexStatement({
    columns,
    name: newName,
    schema,
    table,
    unique,
  })

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
      // One ALTER swaps the index, which InnoDB applies atomically.
      mysql: (db) =>
        sql`
          ALTER TABLE ${sql.id(schema, table)}
          DROP INDEX ${sql.id(name)},
          ADD ${unique ? sql`UNIQUE INDEX` : sql`INDEX`} ${sql.id(newName)} (${identifiers(columns)})
        `.execute(db),
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await sql`DROP INDEX ${sql.id(schema, name)}`.execute(tx)
          await create.execute(tx)
        }),
    },
  })
}
