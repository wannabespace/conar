import { sql } from 'kysely'

import { identifiers } from '~/core/queries/shared/sql-fragments'
import { createQuery } from '~/core/runtime/query'

import type { IndexShape } from './shape'
import {
  addSkipIndexStatement,
  createIndexStatement,
  dropSkipIndexStatement,
  materializeIndexStatement,
} from './shape'

export const recreateIndexQuery = ({
  name,
  newName,
  ...shape
}: IndexShape & { newName: string }) => {
  const { columns, schema, table, unique } = shape
  const replacement = { ...shape, name: newName }
  const create = createIndexStatement(replacement)

  return createQuery({
    query: {
      clickhouse: async (db) => {
        await dropSkipIndexStatement({ name, schema, table }).execute(db)
        await addSkipIndexStatement(replacement).execute(db)
        await materializeIndexStatement(replacement).execute(db)
      },
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
