import { parseConnectionString } from '@conar/connection'
import { parseSSLConfig } from '@conar/connection/ssl/mssql'
import { memoize } from '@conar/shared/utils/helpers'
import mssql from 'mssql'

export const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const options = parseSSLConfig(searchParams)

  return mssql.connect({
    server: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    options,
  })
})
