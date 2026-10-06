import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getPool } from './client'
import { runOn } from './run'

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

      const txId = registerTransaction(
        {
          commit: () => connection.commit(),
          execute: (sql, values, options) =>
            runOn(connection, { conf, connectionString, sql, values }, options),
          release: () => {
            connection.release()
            return Promise.resolve()
          },
          rollback: () => connection.rollback(),
        },
        ownerId
      )
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
} satisfies QueryExecutor
