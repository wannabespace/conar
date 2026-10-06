import { createRequire } from 'node:module'

import { Result } from 'better-result'
import { memoize } from 'memoza'
import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import { parseConnectionString } from '../../..'
import { readSSLFiles } from '../../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../../ssl/mysql'

export const mysql2 = createRequire(import.meta.url)(
  'mysql2/promise'
) as typeof mysql2Promise

const connect = (conf: PoolOptions) =>
  Result.tryPromise({
    catch: (error) => error,
    try: async () => {
      const pool = mysql2.createPool(conf)
      await pool.query('SELECT 1')
      return { conf, pool }
    },
  })

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolOptions = {
    ...config,
    connectionLimit: 1,
    dateStrings: true,
    supportBigNumbers: true,
    ...(ssl && { ssl: readSSLFiles(ssl) }),
  }

  const direct = await connect(conf)
  const result = ssl
    ? direct
    : await direct.tryRecoverAsync(async (error) => {
        const fallback = await connect({ ...conf, ssl: defaultSSLConfig })
        return fallback.mapError(() => error)
      })
  if (result.isErr()) {
    throw result.error
  }
  return result.value
})
