import { once } from 'node:events'
import { createRequire } from 'node:module'
import type net from 'node:net'

import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import { parseConnectionString } from '../../..'
import { sshForwarding } from '../../../ssh/forwarding'
import { parseSSLConfig } from '../../../ssl/mssql'

const mssql = createRequire(import.meta.url)('mssql') as typeof mssqlModule

export const getPool = memoize(async (connectionString: string) => {
  const { database, host, password, port, searchParams, user } =
    parseConnectionString(connectionString)
  const tunnel = sshForwarding.of(connectionString)
  await tunnel?.connect()
  const pool = new mssql.ConnectionPool({
    database,
    options: {
      ...parseSSLConfig(searchParams),
      ...(tunnel && {
        connector: async () => {
          const socket = tunnel.socket()
          await once(socket, 'connect')
          // tedious types its socket as net.Socket but calls only the stream half and setKeepAlive, which the tunnel socket has.
          return socket as unknown as net.Socket
        },
      }),
    },
    password,
    pool: { max: 1 },
    port,
    requestTimeout: 0,
    server: host,
    user,
  })
  pool.on('error', console.error)
  return pool.connect()
})
