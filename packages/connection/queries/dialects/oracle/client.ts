import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as OracleDb from 'oracledb'

import { getDriverConfig } from '../../../parse-connection-string'
import { parseSSLConfig } from '../../../ssl/oracle'
import { describeConnectionString } from '../../../utils'

export const oracledb = createRequire(import.meta.url)(
  'oracledb'
) as typeof OracleDb

// A string bound to a date column converts through these, so it takes the same text `values.ts` reads a date back as; a TIMESTAMP WITH LOCAL TIME ZONE reads and binds in this zone.
const SESSION_SETTINGS = `ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS' NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF' NLS_TIMESTAMP_TZ_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF TZH:TZM' TIME_ZONE = '+00:00'`

const connectionConfig = (
  connectionString: string
): OracleDb.ConnectionAttributes => {
  // node-oracledb opens its own socket, so an SSH channel has nothing to plug into.
  if (describeConnectionString(connectionString).usesSsh) {
    throw new Error('Oracle connections cannot use an SSH tunnel.')
  }
  const { database, host, password, port, searchParams, user } =
    getDriverConfig(connectionString)
  const address = host.includes(':') ? `[${host}]` : host
  return {
    connectString: `${parseSSLConfig(searchParams) ? 'tcps://' : ''}${address}${port ? `:${port}` : ''}/${database ?? ''}`,
    password,
    user,
  }
}

export const connect = async (connectionString: string) => {
  const connection = await oracledb.getConnection(
    connectionConfig(connectionString)
  )
  await connection.execute(SESSION_SETTINGS)
  return connection
}

export const getPool = memoize((connectionString: string) =>
  oracledb.createPool({
    ...connectionConfig(connectionString),
    poolMax: 1,
    sessionCallback: async (connection, _tag, done) => {
      try {
        await connection.execute(SESSION_SETTINGS)
        done()
      } catch (error) {
        done(error)
      }
    },
  })
)
