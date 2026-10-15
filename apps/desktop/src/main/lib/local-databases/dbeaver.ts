import { createDecipheriv } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'
import { app } from 'electron'

import { localDatabase, validEntries } from './local-database'

const DATA_SOURCES = 'workspace6/General/.dbeaver/data-sources.json'
const CREDENTIALS = 'workspace6/General/.dbeaver/credentials-config.json'

// Not a secret: DBeaver obfuscates its credentials file with this fixed key from its own source.
const CREDENTIALS_KEY = Buffer.from('babb4a9f774ab853c96c2d653dfe544a', 'hex')
const IV_BYTES = 16

const DATA_DIRS = [
  path.join(homedir(), 'Library/DBeaverData'),
  path.join(homedir(), '.local/share/DBeaverData'),
  path.join(app.getPath('appData'), 'DBeaverData'),
]

const TYPE_OF_PROVIDER: Partial<Record<string, ConnectionType>> = {
  clickhouse: ConnectionType.ClickHouse,
  mysql: ConnectionType.MySQL,
  postgresql: ConnectionType.Postgres,
  sqlserver: ConnectionType.MSSQL,
}

const dataSourcesSchema = type({ connections: 'Record<string, unknown>' })

const connectionSchema = type([
  'string',
  {
    configuration: {
      'database?': 'string',
      'host?': 'string',
      'port?': 'string | number',
      'user?': 'string',
    },
    name: 'string',
    provider: 'string',
  },
])

const credentialsSchema = type({
  '[string]': { '#connection?': { 'password?': 'string', 'user?': 'string' } },
})

const credentialsIn = async (dataDir: string) => {
  const file = await readFile(path.join(dataDir, CREDENTIALS))
  const decipher = createDecipheriv(
    'aes-128-cbc',
    CREDENTIALS_KEY,
    file.subarray(0, IV_BYTES)
  )
  return credentialsSchema.assert(
    JSON.parse(
      Buffer.concat([
        decipher.update(file.subarray(IV_BYTES)),
        decipher.final(),
      ]).toString('utf-8')
    )
  )
}

const databasesIn = async (dataDir: string) => {
  const { connections } = dataSourcesSchema.assert(
    JSON.parse(await readFile(path.join(dataDir, DATA_SOURCES), 'utf-8'))
  )
  const { data: credentials } = await tryCatchAsync(() =>
    credentialsIn(dataDir)
  )
  return validEntries(connectionSchema, Object.entries(connections)).map(
    ([id, { configuration, name, provider }]) => {
      const saved = credentials?.[id]?.['#connection']
      return localDatabase('DBeaver', name, {
        database: configuration.database,
        host: configuration.host,
        password: saved?.password,
        port: String(configuration.port ?? ''),
        type: TYPE_OF_PROVIDER[provider] ?? null,
        user: saved?.user ?? configuration.user,
      })
    }
  )
}

export const dbeaverDatabases = async () => {
  const dirs = await Promise.all(
    DATA_DIRS.map((dataDir) => tryCatchAsync(() => databasesIn(dataDir)))
  )
  return dirs.flatMap(({ data }) => data ?? [])
}
