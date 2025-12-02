import { createRequire } from 'node:module'
import { parseConnectionString } from '@conar/connection'
import { readSSLFiles } from '@conar/connection/server'
import { parseMysqlSSLConfig } from '@conar/connection/ssl'
import { memoize } from '@conar/shared/utils/helpers'

const mysql2 = createRequire(import.meta.url)('mysql2/promise') as typeof import('mysql2/promise')

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseMysqlSSLConfig(searchParams)

  return mysql2.createPool({
    dateStrings: true,
    ...config,
    ...(ssl ? { ssl: readSSLFiles(ssl) } : {}),
  })
})
