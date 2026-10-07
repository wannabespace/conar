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
    // A statement that aborts the transaction makes SQL Server roll it back;
    // mssql then rejects rollback() with EABORT, which would replace the
    // statement's own error.
    let aborted = false
    transaction.on('rollback', (byServer: boolean) => {
      aborted = byServer
    })
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
        rollback: () => (aborted ? undefined : transaction.rollback()),
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
