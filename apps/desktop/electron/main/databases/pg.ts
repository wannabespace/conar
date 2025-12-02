import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { parsePgSSLConfig } from '@conar/connection/ssl'
import { memoize } from '@conar/shared/utils/helpers'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parsePgSSLConfig(searchParams)

  const pool = new pg.Pool({
    ...config,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  })

  return pool
})
