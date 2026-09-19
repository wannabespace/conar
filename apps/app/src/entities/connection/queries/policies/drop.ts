import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export const dropPolicyQuery = ({
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
      clickhouse: (db) =>
        sql`DROP ROW POLICY ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
          db
        ),
      mssql: unsupported('Dropping security policies'),
      mysql: unsupported('Dropping privileges'),
      postgres: (db) =>
        sql`DROP POLICY ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
          db
        ),
    },
  })
