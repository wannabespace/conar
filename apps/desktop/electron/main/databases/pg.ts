import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { defaultSSLConfig, parseSSLConfig } from '@conar/connection/ssl/pg'
import { memoize } from '@conar/shared/utils/helpers'
import { tries } from '@conar/shared/utils/tries'
import pg from 'pg'

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf = {
    ...config,
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
    !hasSsl && (async () => {
      const pool = new pg.Pool({
        ...conf,
        ssl: defaultSSLConfig,
      })
      await pool.query('SELECT 1')
      return pool
    }),
  )
})
