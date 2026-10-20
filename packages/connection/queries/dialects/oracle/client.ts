import { createRequire } from 'node:module'

import { memoize } from 'memoza'
import type * as OracleDb from 'oracledb'

import { getDriverConfig } from '../../../parse-connection-string'
import { parseSSLConfig } from '../../../ssl/oracle'
import { describeConnectionString } from '../../../utils'

export const oracledb = createRequire(import.meta.url)(
  'oracledb'
) as typeof OracleDb

// A string bound to a date column converts through these, so it takes the same text a date reads back as.
const SESSION_FORMATS = `ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD HH24:MI:SS' NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF' NLS_TIMESTAMP_TZ_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF TZH:TZM'`

const SSH_UNSUPPORTED = 'Oracle connections cannot use an SSH tunnel yet.'

export const connectionConfig = (
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

export const setSessionFormats = async (connection: OracleDb.Connection) => {
  await connection.execute(SESSION_FORMATS)
}

export const connect = async (connectionString: string) => {
  const connection = await oracledb.getConnection(
    connectionConfig(connectionString)
  )
  await setSessionFormats(connection)
  return connection
}

export const getPool = memoize((connectionString: string) =>
  oracledb.createPool({
    ...connectionConfig(connectionString),
    poolIncrement: 1,
    poolMax: 1,
    poolMin: 0,
    queueTimeout: 0,
    sessionCallback: (connection, _tag, done) => {
      void (async () => {
        try {
          await setSessionFormats(connection)
          done()
        } catch (error) {
          done(error)
        }
      })()
    },
  })
)
