import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/tries'
import { memoize } from 'memoza'
import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import { parseConnectionString } from '../../..'
import { readSSLFiles } from '../../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../../ssl/mysql'

export const mysql2 = createRequire(import.meta.url)(
  'mysql2/promise'
) as typeof mysql2Promise

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolOptions = {
    ...config,
    connectionLimit: 1,
    dateStrings: true,
    ...(ssl ? { ssl: readSSLFiles(ssl) } : {}),
  }
  const hasSsl = conf.ssl !== undefined

  return tries(
    async () => {
      const pool = mysql2.createPool(conf)
      await pool.query('SELECT 1')
      return { conf, pool }
    },
    !hasSsl &&
      (async ({ previousError }) => {
        const fallback = { ...conf, ssl: defaultSSLConfig }
        const pool = mysql2.createPool(fallback)
        await pool.query('SELECT 1').catch(() => {
          throw previousError
        })
        return { conf: fallback, pool }
      })
  )
})
