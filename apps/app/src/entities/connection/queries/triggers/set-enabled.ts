import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

export const setTriggerEnabledQuery = ({
  enabled,
  name,
  schema,
  table,
}: {
  enabled: boolean
  name: string
  schema: string
  table: string
}) => {
  const verb = sql.raw(enabled ? 'ENABLE' : 'DISABLE')

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) =>
        sql`${verb} TRIGGER ${sql.id(schema, name)} ON ${sql.id(schema, table)}`.execute(
          db
        ),
      mysql: unsupported('Disabling triggers'),
      postgres: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} ${verb} TRIGGER ${sql.id(name)}`.execute(
          db
        ),
    },
  })
}
