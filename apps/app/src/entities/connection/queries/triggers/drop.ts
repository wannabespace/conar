import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { unsupported } from '../shared/unsupported'

export const dropTriggerQuery = ({
  name,
  schema,
  table,
}: {
  name: string
  schema: string
  table: string
}) => {
  const dropByName = sql`DROP TRIGGER ${sql.id(schema, name)}`

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) => dropByName.execute(db),
      mysql: (db) => dropByName.execute(db),
      postgres: (db) =>
        sql`DROP TRIGGER ${sql.id(name)} ON ${sql.id(schema, table)}`.execute(
          db
        ),
    },
  })
}
