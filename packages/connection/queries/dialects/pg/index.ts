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
      const pool = await getPool(connectionString)
      const client = await pool.connect()

      try {
        await client.query(
          [
            'BEGIN',
            isolationLevel && `ISOLATION LEVEL ${isolationLevel}`,
            accessMode,
          ]
            .filter(Boolean)
            .join(' ')
        )
      } catch (error) {
        client.release()
        throw error
      }

      const txId = registerTransaction(
        {
          commit: async () => {
            await client.query('COMMIT')
          },
          execute: (sql, values, options) =>
            runOn(client, { connectionString, pool, sql, values }, options),
          release: () => {
            client.release()
            return Promise.resolve()
          },
          rollback: async () => {
            await client.query('ROLLBACK')
          },
        },
        ownerId
      )
      return { txId }
    }
  ),

  cancel,

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      const client = await pool.connect()
      try {
        return await runOn(
          client,
          { connectionString, pool, sql, values },
          options
        )
      } finally {
        client.release()
      }
    }
  ),
} satisfies QueryExecutor
