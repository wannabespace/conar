import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getPool, mssql, poolConfig } from './client'
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

  openSession: handleQueryError(async ({ connectionString, ownerId }) => {
    const config = await poolConfig(connectionString)
    const session = await new mssql.ConnectionPool({
      ...config,
      // `min: 1` keeps the idle reaper off the one connection: reaping it would roll the transaction back and run the next request outside it.
      pool: { max: 1, min: 1 },
    }).connect()
    session.on('error', console.error)
    const txId = registerTransaction(
      {
        commit: async () => {
          await session.request().batch('COMMIT')
        },
        execute: (sql, values, options) =>
          runRequest(
            session.request(),
            // `query` wraps the SQL in sp_executesql, which rejects a batch leaving a transaction open (error 266) and drops its #temp tables.
            { batch: true, connectionString, sql, values },
            options
          ),
        inTransaction: async () => {
          const { recordset } = await session
            .request()
            .query<{ count: number }>('SELECT @@TRANCOUNT AS count')
          return (recordset[0]?.count ?? 0) > 0
        },
        release: () => session.close(),
        rollback: async () => {
          await session.request().batch('ROLLBACK')
        },
      },
      ownerId
    )
    return { txId }
  }),
} satisfies QueryExecutor
