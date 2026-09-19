import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export const dropIndexQuery = ({
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
      clickhouse: unsupported('Dropping indexes'),
      mssql: (db) =>
        sql`DROP INDEX ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(db),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} DROP INDEX ${sql.id(name)}`.execute(
          db
        ),
      postgres: (db) => sql`DROP INDEX ${sql.id(schema, name)}`.execute(db),
    },
  })
