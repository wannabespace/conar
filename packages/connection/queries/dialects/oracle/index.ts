import type * as OracleDb from 'oracledb'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { connect, getPool } from './client'
import { runOn } from './run'

const register = (
  connection: OracleDb.Connection,
  { connectionString, ownerId }: { connectionString: string; ownerId?: string }
) =>
  registerTransaction(
    {
      commit: () => connection.commit(),
      execute: (sql, values, options) =>
        runOn(
          connection,
          { autoCommit: false, connectionString, sql, values },
          options
        ),
      release: () => connection.close(),
      rollback: () => connection.rollback(),
      // Oracle opens a transaction at the first change and DDL commits it, so only the server's flag knows whether one is open.
      status: () =>
        Promise.resolve(connection.transactionInProgress ? 'open' : 'ended'),
    },
    ownerId
  )

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({ accessMode, connectionString, isolationLevel, ownerId }) => {
      const pool = await getPool(connectionString)
      const connection = await pool.getConnection()
      try {
        // READ ONLY and ISOLATION LEVEL are alternative clauses of one SET TRANSACTION; a read-only transaction already reads one snapshot.
        const setting =
          accessMode === 'read only'
            ? 'READ ONLY'
            : isolationLevel && `ISOLATION LEVEL ${isolationLevel}`
        if (setting) {
          await connection.execute(`SET TRANSACTION ${setting}`)
        }
      } catch (error) {
        await connection.close()
        throw error
      }
      return { txId: register(connection, { connectionString, ownerId }) }
    }
  ),

  cancel,

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      const connection = await pool.getConnection()
      try {
        return await runOn(
          connection,
          { autoCommit: true, connectionString, sql, values },
          options
        )
      } finally {
        await connection.close()
      }
    }
  ),

  openSession: handleQueryError(async ({ connectionString, ownerId }) => {
    const connection = await connect(connectionString)
    return { txId: register(connection, { connectionString, ownerId }) }
  }),
} satisfies QueryExecutor
