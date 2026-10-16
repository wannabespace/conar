import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import { parseConnectionString } from '../../..'
import { parseSSLConfig } from '../../../ssl/mssql'

export const mssql = createRequire(import.meta.url)(
  'mssql'
) as typeof mssqlModule

export const poolConfig = (connectionString: string): mssqlModule.config => {
  const { database, host, password, port, searchParams, user } =
    parseConnectionString(connectionString)
  return {
    database,
    options: parseSSLConfig(searchParams),
    password,
    pool: { max: 1 },
    port,
    requestTimeout: 0,
    server: host,
    user,
  }
}

export const getPool = memoize((connectionString: string) => {
  const pool = new mssql.ConnectionPool(poolConfig(connectionString))
  pool.on('error', console.error)
  return pool.connect()
})
