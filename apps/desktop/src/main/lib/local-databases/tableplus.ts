import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { EMPTY_SSH_TUNNEL } from '@tamery/connection/ssh/params'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'

import { keychain } from './keychain'
import { localDatabase } from './local-database'

const CONNECTION_FILES = [
  'com.tinyapp.TablePlus',
  'com.tinyapp.TablePlus-setapp',
].map((bundleId) =>
  path.join(
    homedir(),
    'Library/Application Support',
    bundleId,
    'Data/Connections.plist'
  )
)

const TYPE_OF_DRIVER: Partial<Record<string, ConnectionType>> = {
  clickhouse: ConnectionType.ClickHouse,
  cockroachdb: ConnectionType.Postgres,
  mariadb: ConnectionType.MySQL,
  'microsoft sql server': ConnectionType.MSSQL,
  mysql: ConnectionType.MySQL,
  postgresql: ConnectionType.Postgres,
  sqlserver: ConnectionType.MSSQL,
}

const connectionsSchema = type({
  ConnectionName: 'string',
  DatabaseHost: 'string',
  DatabaseName: 'string',
  DatabasePort: 'string',
  DatabaseUser: 'string',
  Driver: 'string',
  ID: 'string',
  'ServerAddress?': 'string',
  'ServerPort?': 'string',
  'ServerUser?': 'string',
  'isOverSSH?': 'boolean',
}).array()

const databasesIn = async (file: string) => {
  const { stdout } = await promisify(execFile)('/usr/bin/plutil', [
    '-convert',
    'json',
    '-o',
    '-',
    file,
  ])
  return connectionsSchema.assert(JSON.parse(stdout)).map((connection) => {
    const database = localDatabase('TablePlus', connection.ConnectionName, {
      database: connection.DatabaseName,
      host: connection.DatabaseHost,
      port: connection.DatabasePort,
      ssh: connection.isOverSSH
        ? {
            ...EMPTY_SSH_TUNNEL,
            host: connection.ServerAddress ?? '',
            port: connection.ServerPort ?? '',
            user: connection.ServerUser ?? '',
          }
        : null,
      type: TYPE_OF_DRIVER[connection.Driver.toLowerCase()] ?? null,
      user: connection.DatabaseUser,
    })
    keychain.remember(database.connectionString, {
      account: `${connection.ID}_database`,
      service: 'com.tableplus.TablePlus',
    })
    return database
  })
}

/** macOS only. */
export const tablePlusDatabases = async () => {
  if (process.platform !== 'darwin') {
    return []
  }
  const files = await Promise.all(
    CONNECTION_FILES.map((file) => tryCatchAsync(() => databasesIn(file)))
  )
  return files.flatMap(({ data }) => data ?? [])
}
