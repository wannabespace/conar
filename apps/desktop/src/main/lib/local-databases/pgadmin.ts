import { homedir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { localDatabase, validEntries } from './local-database'

const SETTINGS_DATABASE = path.join(homedir(), '.pgadmin/pgadmin4.db')

const serverSchema = type({
  host: 'string | null',
  maintenance_db: 'string | null',
  name: 'string',
  port: 'number | null',
  username: 'string | null',
})

export const pgAdminDatabases = () => {
  // readOnly also stops SQLite creating the file when pgAdmin was never installed.
  const database = new DatabaseSync(SETTINGS_DATABASE, { readOnly: true })
  try {
    const servers = validEntries(
      serverSchema,
      database
        .prepare(
          'SELECT name, host, port, maintenance_db, username FROM server'
        )
        .all()
    )
    return servers.flatMap((server) =>
      localDatabase('pgAdmin', server.name, {
        database: server.maintenance_db ?? undefined,
        host: server.host ?? undefined,
        port: server.port?.toString(),
        type: ConnectionType.Postgres,
        user: server.username ?? undefined,
      })
    )
  } finally {
    database.close()
  }
}
