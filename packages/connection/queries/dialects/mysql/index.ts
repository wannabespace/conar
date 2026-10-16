import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import {
  registerTransaction,
  sessionConnection,
  transactionQueries,
} from '../../transactions'
import { getPool, mysql2 } from './client'
import { runOn } from './run'

const register = (
  connection: mysql2Promise.Connection,
  {
    conf,
    connectionString,
    ownerId,
    release,
  }: {
    conf: PoolOptions
    connectionString: string
    ownerId?: string
    release: () => Promise<void>
  }
) =>
  registerTransaction(
    {
      commit: () => connection.commit(),
      execute: (sql, values, options) =>
        runOn(connection, { conf, connectionString, sql, values }, options),
      release,
      rollback: () => connection.rollback(),
    },
    ownerId
  )

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({ accessMode, connectionString, isolationLevel, ownerId }) => {
      const { conf, pool } = await getPool(connectionString)
      const connection = await pool.getConnection()

      try {
        // MySQL's START TRANSACTION cannot carry an isolation level; SET TRANSACTION applies it to the next one.
        if (isolationLevel) {
          await connection.query(
            `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`
          )
        }
        await connection.query(
          accessMode ? `START TRANSACTION ${accessMode}` : 'START TRANSACTION'
        )
      } catch (error) {
        connection.release()
        throw error
      }

      const txId = register(connection, {
        conf,
        connectionString,
        ownerId,
        release: () => {
          connection.release()
          return Promise.resolve()
        },
      })
      return { txId }
    }
  ),

  cancel,

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const { conf, pool } = await getPool(connectionString)
      const connection = await pool.getConnection()
      try {
        return await runOn(
          connection,
          { conf, connectionString, sql, values },
          options
        )
      } finally {
        connection.release()
      }
    }
  ),

  openSession: handleQueryError(async ({ connectionString, ownerId }) => {
    const { conf } = await getPool(connectionString)
    const connection = await sessionConnection(() =>
      mysql2.createConnection(conf)
    )
    // An unhandled `error` (the server dropping the connection) would crash the process.
    connection.on('error', console.error)
    const txId = register(connection, {
      conf,
      connectionString,
      ownerId,
      release: () => connection.end(),
    })
    return { txId }
  }),
} satisfies QueryExecutor
