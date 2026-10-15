import { once } from 'node:events'
import { get } from 'node:http'
import { homedir } from 'node:os'
import path from 'node:path'
import { text } from 'node:stream/consumers'

import {
  connectionTypeOf,
  TYPE_OF_DEFAULT_PORT,
} from '@tamery/connection/connection-parts'
import { partsOfVariables } from '@tamery/connection/guess/env'
import { mergeParts } from '@tamery/connection/guess/parts'
import {
  ConnectionType,
  dialectOf,
  SqlDialect,
} from '@tamery/shared/enums/connection-type'
import { type } from 'arktype'

import type { Finder } from './local-database'
import { findEach } from './local-database'

const { DOCKER_HOST } = process.env

const SOCKETS = (
  DOCKER_HOST
    ? [/^unix:\/\/(?<path>.+)$/u.exec(DOCKER_HOST)?.groups?.path]
    : [
        '/var/run/docker.sock',
        path.join(homedir(), '.docker/run/docker.sock'),
        path.join(homedir(), '.orbstack/run/docker.sock'),
        path.join(homedir(), '.colima/default/docker.sock'),
        path.join(homedir(), '.rd/docker.sock'),
        String.raw`\\.\pipe\docker_engine`,
      ]
).filter((socket) => socket !== undefined)

const ANSWER_TIMEOUT_MS = 2000
const ANY_ADDRESS = new Set(['', '0.0.0.0', '::'])

const IMAGE_USERS: Record<SqlDialect, string> = {
  [SqlDialect.ClickHouse]: 'default',
  [SqlDialect.MSSQL]: 'sa',
  [SqlDialect.MySQL]: 'root',
  [SqlDialect.Postgres]: 'postgres',
}

const containersSchema = type({
  Id: 'string',
  Image: 'string',
  Names: 'string[]',
  Ports: type({
    'IP?': 'string',
    PrivatePort: 'number',
    'PublicPort?': 'number',
  }).array(),
}).array()

const inspectSchema = type({ Config: { Env: 'string[]' } })

const dockerGet = async (socketPath: string, urlPath: string) => {
  const request = get({ path: urlPath, socketPath, timeout: ANSWER_TIMEOUT_MS })
  request.on('timeout', () =>
    request.destroy(new Error('Docker did not answer'))
  )
  const [response] = await once(request, 'response')
  return JSON.parse(await text(response))
}

export const docker: Finder = {
  read: async (socketPath) => {
    const containers = containersSchema.assert(
      await dockerGet(socketPath, '/containers/json')
    )
    return findEach(containers, async ({ Id, Image, Names, Ports }) => {
      const published = Ports.flatMap(
        ({ IP = '', PrivatePort, PublicPort }) => {
          const connectionType = TYPE_OF_DEFAULT_PORT[PrivatePort]
          return connectionType && PublicPort
            ? [
                {
                  connectionType,
                  host: ANY_ADDRESS.has(IP) ? 'localhost' : IP,
                  port: String(PublicPort),
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
      // Split by hand, not `variablesOfLines`: a container's value is exact, so quotes and ` #` belong to the password.
      const env =
        partsOfVariables(
          Object.fromEntries(
            Config.Env.map((variable) => {
              const equals = variable.indexOf('=')
              return [variable.slice(0, equals), variable.slice(equals + 1)]
            })
          )
        ) ?? {}
      const name = Names[0]?.replace(/^\//u, '') ?? ''
      const named = [
        connectionTypeOf(
          Image.replace(/[:@][^/]*$/u, '')
            .split('/')
            .at(-1) ?? ''
        ),
        env.type,
      ]
      return published.map(({ connectionType, ...server }) => {
        const dialect = dialectOf(connectionType)
        const parts = mergeParts(
          {
            ...server,
            type:
              named.find(
                (candidate) => candidate && dialectOf(candidate) === dialect
              ) ?? connectionType,
          },
          env,
          { user: IMAGE_USERS[dialect] }
        )
        return {
          name,
          parts:
            connectionType === ConnectionType.Postgres
              ? { database: parts.user, ...parts }
              : parts,
        }
      })
    })
  },
  source: 'Docker',
  targets: () => SOCKETS,
}
