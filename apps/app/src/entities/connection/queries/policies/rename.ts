import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

export const renamePolicyQuery = ({
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
      clickhouse: unsupported('Renaming row policies'),
      mssql: unsupported('Renaming security policies'),
      mysql: unsupported('Renaming privileges'),
      postgres: (db) =>
        sql`ALTER POLICY ${sql.id(name)} ON ${sql.id(schema, table)} RENAME TO ${sql.id(newName)}`.execute(
          db
        ),
    },
  })
