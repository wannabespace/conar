import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getPool } from './client'
import { runRequest } from './run'

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(async ({ connectionString, ownerId }) => {
    const pool = await getPool(connectionString)
    const transaction = pool.transaction()
    await transaction.begin()

    const txId = registerTransaction(
      {
        commit: () => transaction.commit(),
        execute: (sql, values, options) =>
          runRequest(
            transaction.request(),
            { connectionString, sql, values },
            options
          ),
        release: async () => {
          // mssql's `Transaction` releases its connection internally on commit/rollback.
        },
        rollback: () => transaction.rollback(),
      },
      ownerId
    )
    return { txId }
  }),

  cancel,

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      return runRequest(
        pool.request(),
        { connectionString, sql, values },
        options
      )
    }
  ),
} satisfies QueryExecutor
