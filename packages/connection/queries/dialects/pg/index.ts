import type { QueryExecutor, TransactionSettings } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getPool } from './client'
import { runOn } from './run'

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({
      accessMode,
      connectionString,
      isolationLevel,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    } & TransactionSettings) => {
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
          execute: (sqlText, values, options) =>
            runOn({ client, connectionString, pool }, sqlText, values, options),
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
    async ({ connectionString, query: sqlText, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      const client = await pool.connect()
      try {
        return await runOn(
          { client, connectionString, pool },
          sqlText,
          values,
          options
        )
      } finally {
        client.release()
      }
    }
  ),
} satisfies QueryExecutor
