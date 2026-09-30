import { createRequire } from 'node:module'

import { Result } from 'better-result'
import { memoize } from 'memoza'
import type { PoolConfig } from 'pg'
import type * as PgModule from 'pg'

import { parseConnectionString } from '../../..'
import { readSSLFiles } from '../../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../../ssl/pg'

export const pg = createRequire(import.meta.url)('pg') as typeof PgModule

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const connect = (options: PoolConfig) =>
  Result.tryPromise({
    catch: (error) => error,
    try: async () => {
      const pool = new pg.Pool(options)
      pool.on('error', console.error)
      await pool.query('SELECT 1')
      return pool
    },
  })

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolConfig = {
    ...config,
    connectionTimeoutMillis: 30_000,
    max: 1,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  }
  const hasSsl = conf.ssl !== undefined && conf.ssl !== false

  const direct = await connect(conf)
  const result = hasSsl
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
