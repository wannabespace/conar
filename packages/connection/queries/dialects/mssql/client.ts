import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as mssqlModule from 'mssql'

import { parseConnectionString } from '../../..'
import { parseSSLConfig } from '../../../ssl/mssql'

const mssql = createRequire(import.meta.url)('mssql') as typeof mssqlModule

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const options = parseSSLConfig(searchParams)

  const pool = new mssql.ConnectionPool({
    database: config.database,
    options,
    password: config.password,
    pool: {
      max: 1,
    },
    port: config.port,
    requestTimeout: 0,
    server: config.host,
    user: config.user,
  })
  pool.on('error', console.error)
  return pool.connect()
})
