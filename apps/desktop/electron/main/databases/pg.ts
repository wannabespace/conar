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

function removePool(connectionString: string) {
  const pool = poolMap.get(connectionString)
  if (pool) {
    poolMap.delete(connectionString)
    pool.end().catch(() => null)
  }
}

app.on('before-quit', () => {
  poolMap.forEach(pool => pool.end())
})

export function getPool(connectionString: string) {
  const existingPool = poolMap.get(connectionString)

  if (existingPool) {
    return existingPool
  }

  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parsePgSSLConfig(searchParams)

  const pool = new pg.Pool({
    ...config,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  })

  pool.on('remove', () => {
    removePool(connectionString)
  })

  poolMap.set(connectionString, pool)

  return pool
}
