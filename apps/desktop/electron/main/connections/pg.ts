import type { PoolConfig } from 'pg'
import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { defaultSSLConfig, parseSSLConfig } from '@conar/connection/ssl/pg'
import { memoize } from '@conar/shared/utils/helpers'
import { tries } from '@conar/shared/utils/tries'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const SUPABASE_HOST = /\.supabase\.co$|\.pooler\.supabase\.com$/i

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, host, ...config } = parseConnectionString(connectionString)
  let ssl = parseSSLConfig(searchParams)
  const isSupabase = SUPABASE_HOST.test(host)
  if (isSupabase && ssl === undefined) {
    ssl = defaultSSLConfig
  }
  const conf: PoolConfig = {
    ...config,
    host,
    max: 1,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  }
  const hasSsl = conf.ssl !== undefined && conf.ssl !== false

  return tries(
    async () => {
      const pool = new pg.Pool(conf)
      await pool.query('SELECT 1')
      return pool
    },
    !hasSsl && (async ({ previousError }) => {
      const pool = new pg.Pool({
        ...conf,
        ssl: defaultSSLConfig,
      })
      await pool.query('SELECT 1').catch(() => {
        throw previousError
      })
      return pool
    }),
  ).catch((error) => {
    if (error instanceof AggregateError) {
      throw error.errors[0]
    }

    throw error
  })
})
