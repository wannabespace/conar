import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { defaultSSLConfig, parseSSLConfig } from '@conar/connection/ssl/mysql'
import { memoize } from '@conar/shared/utils/helpers'
import { tries } from '@conar/shared/utils/tries'

const mysql2 = createRequire(import.meta.url)('mysql2/promise') as typeof import('mysql2/promise')

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf = {
    dateStrings: true,
    ...config,
    ...(ssl ? { ssl: readSSLFiles(ssl) } : {}),
  }
  const hasSsl = conf.ssl !== undefined

  return tries(
    async () => {
      const pool = mysql2.createPool(conf)
      await pool.query('SELECT 1')
      return pool
    },
    !hasSsl && (async () => {
      const pool = mysql2.createPool({
        ...conf,
        ssl: defaultSSLConfig,
      })
      await pool.query('SELECT 1')
      return pool
    }),
  )
})
