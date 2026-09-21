import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'

// Postgres remembers whether a trigger fires on the origin, on a replica or
// always; a plain ENABLE would quietly move a replica trigger to the origin.
const postgresVerb = (enabled: boolean, mode: string) => {
  if (!enabled) {
    return 'DISABLE'
  }

  return { A: 'ENABLE ALWAYS', R: 'ENABLE REPLICA' }[mode] ?? 'ENABLE'
}

export const setTriggerEnabledQuery = ({
  enabled,
  mode = 'O',
  name,
  schema,
  table,
}: {
  enabled: boolean
  mode?: string
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
        sql`ALTER TABLE ${sql.id(schema, table)} ${sql.raw(postgresVerb(enabled, mode))} TRIGGER ${sql.id(name)}`.execute(
          db
        ),
    },
  })
}
