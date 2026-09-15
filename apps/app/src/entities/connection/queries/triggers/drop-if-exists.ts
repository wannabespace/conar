import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

export const dropTriggerIfExistsQuery = ({
  name,
  schema,
  table,
}: {
  name: string
  schema: string
  table: string
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: unsupported('Replacing triggers by drop'),
      mysql: (db) =>
        sql`DROP TRIGGER IF EXISTS ${sql.id(schema, name)}`.execute(db),
      postgres: (db) =>
        sql`DROP TRIGGER IF EXISTS ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
          db
        ),
    },
  })
