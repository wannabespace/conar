import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { EMPTY_SSH_TUNNEL } from '@tamery/connection/ssh/params'
import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { keychainPassword } from './keychain'
import { findEach, localDatabase, validEntries } from './local-database'

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

const connectionSchema = type({
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
})

const databasesIn = async (file: string) => {
  const { stdout } = await promisify(execFile)('/usr/bin/plutil', [
    '-convert',
    'json',
    '-o',
    '-',
    file,
  ])
  return validEntries(
    connectionSchema,
    type('unknown[]').assert(JSON.parse(stdout))
  ).flatMap((connection) => {
    const driver = connection.Driver.toLowerCase()
    return localDatabase(
      'TablePlus',
      connection.ConnectionName,
      {
        database: connection.DatabaseName,
        flavor: driver === 'mariadb' ? ConnectionFlavor.MariaDB : undefined,
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
        type: TYPE_OF_DRIVER[driver] ?? null,
        user: connection.DatabaseUser,
      },
      () =>
        keychainPassword({
          account: `${connection.ID}_database`,
          service: 'com.tableplus.TablePlus',
        })
    )
  })
}

export const tablePlusDatabases = () => {
  if (process.platform !== 'darwin') {
    return []
  }
  return findEach(CONNECTION_FILES, databasesIn)
}
