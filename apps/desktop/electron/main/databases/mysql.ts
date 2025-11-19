import type { Pool } from 'mysql2/promise'
import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { parseMysqlSSLConfig } from '@conar/connection/ssl'
import { app } from 'electron'

const mysql2 = createRequire(import.meta.url)('mysql2/promise') as typeof import('mysql2/promise')

export const poolMap: Map<string, Pool> = new Map()

app.on('before-quit', () => {
  poolMap.forEach(pool => pool.end())
})

export function getPool(connectionString: string) {
  const existingPool = poolMap.get(connectionString)

  if (existingPool) {
    return existingPool
  }

  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseMysqlSSLConfig(searchParams)

  const pool = mysql2.createPool({
    dateStrings: true,
    ...config,
    ...(ssl ? { ssl: readSSLFiles(ssl) } : {}),
  })

  poolMap.set(connectionString, pool)

  return pool
}
