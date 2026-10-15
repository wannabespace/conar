import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { engineOfScheme } from '@tamery/connection/connection-parts'
import { EMPTY_SSH_TUNNEL } from '@tamery/connection/ssh/params'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import { keychainPassword } from './keychain'
import type { Finder } from './local-database'
import { validEntries } from './local-database'

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

const MSSQL_DRIVER = 'microsoft sql server'

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

export const tablePlus: Finder = {
  files: CONNECTION_FILES,
  read: async (file) => {
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
    ).map((connection) => ({
      name: connection.ConnectionName,
      parts: {
        database: connection.DatabaseName,
        engine:
          connection.Driver.toLowerCase() === MSSQL_DRIVER
            ? ConnectionType.MSSQL
            : engineOfScheme(connection.Driver),
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
        user: connection.DatabaseUser,
      },
      unlock: () =>
        keychainPassword({
          account: `${connection.ID}_database`,
          service: 'com.tableplus.TablePlus',
        }),
    }))
  },
  source: 'TablePlus',
}
