import { once } from 'node:events'
import { get } from 'node:http'
import { homedir } from 'node:os'
import path from 'node:path'
import { text } from 'node:stream/consumers'

import { DEFAULT_PORTS } from '@tamery/connection/connection-parts'
import type { GuessedParts } from '@tamery/connection/guess/types'
import {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import { objectEntries, tryCatchAsync } from '@tamery/shared/utils'
import { type } from 'arktype'

import { localDatabase } from './local-database'

const SOCKETS = [
  process.env.DOCKER_HOST?.match(/^unix:\/\/(?<path>.+)$/u)?.groups?.path,
  '/var/run/docker.sock',
  path.join(homedir(), '.docker/run/docker.sock'),
  path.join(homedir(), '.orbstack/run/docker.sock'),
  path.join(homedir(), '.colima/default/docker.sock'),
  path.join(homedir(), '.rd/docker.sock'),
  String.raw`\\.\pipe\docker_engine`,
].filter((socket) => socket !== undefined)

const ANSWER_TIMEOUT_MS = 2000
const ANY_ADDRESS = new Set(['', '0.0.0.0', '::'])

const TYPE_OF_CONTAINER_PORT: Record<number, ConnectionType> =
  Object.fromEntries(
    objectEntries(DEFAULT_PORTS).map(([connectionType, port]) => [
      port,
      connectionType,
    ])
  )

const containersSchema = type({
  Id: 'string',
  Names: 'string[]',
  Ports: type({
    'IP?': 'string',
    PrivatePort: 'number',
    'PublicPort?': 'number',
  }).array(),
}).array()

const inspectSchema = type({ Config: { Env: 'string[]' } })

type Env = Partial<Record<string, string>>
type Credentials = Pick<
  GuessedParts,
  'database' | 'flavor' | 'password' | 'user'
>

const CREDENTIALS_OF: Record<ConnectionType, (env: Env) => Credentials> = {
  [ConnectionType.ClickHouse]: (env) => ({
    database: env.CLICKHOUSE_DB ?? '',
    password: env.CLICKHOUSE_PASSWORD ?? '',
    user: env.CLICKHOUSE_USER ?? 'default',
  }),
  [ConnectionType.MSSQL]: (env) => ({
    database: '',
    password: env.MSSQL_SA_PASSWORD ?? env.SA_PASSWORD ?? '',
    user: 'sa',
  }),
  [ConnectionType.MySQL]: (env) => {
    const user = env.MYSQL_USER ?? env.MARIADB_USER
    return {
      database: env.MYSQL_DATABASE ?? env.MARIADB_DATABASE ?? '',
      flavor: Object.keys(env).some((name) => name.startsWith('MARIADB_'))
        ? ConnectionFlavor.MariaDB
        : null,
      password:
        (user
          ? (env.MYSQL_PASSWORD ?? env.MARIADB_PASSWORD)
          : (env.MYSQL_ROOT_PASSWORD ?? env.MARIADB_ROOT_PASSWORD)) ?? '',
      user: user ?? 'root',
    }
  },
  [ConnectionType.Postgres]: (env) => {
    const user = env.POSTGRES_USER ?? 'postgres'
    return {
      database: env.POSTGRES_DB ?? user,
      password: env.POSTGRES_PASSWORD ?? '',
      user,
    }
  },
}

const dockerGet = async (socketPath: string, urlPath: string) => {
  const request = get({ path: urlPath, socketPath, timeout: ANSWER_TIMEOUT_MS })
  request.on('timeout', () =>
    request.destroy(new Error('Docker did not answer'))
  )
  const [response] = await once(request, 'response')
  return JSON.parse(await text(response))
}

const databasesOn = async (socketPath: string) => {
  const containers = containersSchema.assert(
    await dockerGet(socketPath, '/containers/json')
  )
  const found = await Promise.all(
    containers.map(async ({ Id, Names, Ports }) => {
      const published = Ports.flatMap(
        ({ IP = '', PrivatePort, PublicPort }) => {
          const connectionType = TYPE_OF_CONTAINER_PORT[PrivatePort]
          return connectionType && PublicPort
            ? [
                {
                  host: ANY_ADDRESS.has(IP) ? 'localhost' : IP,
                  port: String(PublicPort),
                  type: connectionType,
                },
              ]
            : []
        }
      )
      if (published.length === 0) {
        return []
      }
      const { Config } = inspectSchema.assert(
        await dockerGet(socketPath, `/containers/${Id}/json`)
      )
      const env: Env = Object.fromEntries(
        Config.Env.map((variable) => {
          const equals = variable.indexOf('=')
          return [variable.slice(0, equals), variable.slice(equals + 1)]
        })
      )
      const name = Names[0]?.replace(/^\//u, '') ?? ''
      return published.map((server) =>
        localDatabase('Docker', name, {
          ...CREDENTIALS_OF[server.type](env),
          ...server,
        })
      )
    })
  )
  return found.flat()
}

export const dockerDatabases = async () => {
  const sockets = await Promise.all(
    SOCKETS.map((socket) => tryCatchAsync(() => databasesOn(socket)))
  )
  return sockets.flatMap(({ data }) => data ?? [])
}
