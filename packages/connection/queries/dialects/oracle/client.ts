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

const SSH_UNSUPPORTED = 'Oracle connections cannot use an SSH tunnel.'

const connectionConfig = (
  connectionString: string
): OracleDb.ConnectionAttributes => {
  // node-oracledb opens its own socket, so an SSH channel has nothing to plug into.
  if (describeConnectionString(connectionString).usesSsh) {
    throw new Error(SSH_UNSUPPORTED)
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
    poolIncrement: 1,
    poolMax: 1,
    poolMin: 0,
    sessionCallback: (connection, _tag, done) => {
      void (async () => {
        try {
          await connection.execute(SESSION_SETTINGS)
          done()
        } catch (error) {
          done(error)
        }
      })()
    },
  })
)
