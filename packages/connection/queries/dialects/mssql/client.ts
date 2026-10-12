import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import { parseConnectionString } from '../../..'
import { SSH_TLS_HOST_PARAM } from '../../../ssh/params'
import { parseSSLConfig } from '../../../ssl/mssql'

const mssql = createRequire(import.meta.url)('mssql') as typeof mssqlModule

export const getPool = memoize((connectionString: string) => {
  const { database, host, password, port, searchParams, user } =
    parseConnectionString(connectionString)
  const tlsHost = searchParams.get(SSH_TLS_HOST_PARAM)
  const pool = new mssql.ConnectionPool({
    database,
    options: {
      ...parseSSLConfig(searchParams),
      ...(tlsHost && { serverName: tlsHost }),
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
