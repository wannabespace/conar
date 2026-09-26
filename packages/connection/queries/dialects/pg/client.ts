import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/tries'
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

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolConfig = {
    ...config,
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
    !hasSsl &&
      (async ({ previousError }) => {
        const pool = new pg.Pool({
          ...conf,
          ssl: defaultSSLConfig,
        })
        await pool.query('SELECT 1').catch(() => {
          throw previousError
        })
        return pool
      })
  )
})
