import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { IndexTarget } from './shape'
import { dropSkipIndexStatement } from './shape'

export const dropIndexQuery = ({ name, schema, table }: IndexTarget) =>
  createQuery({
    query: {
      clickhouse: (db) =>
        dropSkipIndexStatement({ name, schema, table }).execute(db),
      mssql: (db) =>
        sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(db),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}`.execute(
          db
        ),
      postgres: (db) => sql`DROP INDEX ${sql.id(schema, name)}`.execute(db),
    },
  })
