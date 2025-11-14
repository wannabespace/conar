import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { parsePgSSLConfig } from '@conar/connection/ssl'
import { app } from 'electron'

const pg = createRequire(import.meta.url)('pg') as typeof import('pg')

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

export const poolMap: Map<string, InstanceType<typeof pg.Pool>> = new Map()

app.on('before-quit', () => {
  poolMap.forEach(pool => pool.end())
})

export function getPool(connectionString: string) {
  const existingPool = poolMap.get(connectionString)

  if (existingPool) {
    return existingPool
  }

  const config = parseConnectionString(connectionString)
  const ssl = parsePgSSLConfig(config.searchParams)

  const pool = new pg.Pool({
    ...config,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  })

  poolMap.set(connectionString, pool)

  return pool
}
