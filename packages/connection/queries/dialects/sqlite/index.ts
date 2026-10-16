import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getDatabase, openDatabase } from './client'
import { runOn } from './run'

export const query = {
  ...transactionQueries,

  // A transaction gets its own handle: on the shared one, every other query would run inside it.
  beginTransaction: handleQueryError(
    ({ accessMode, connectionString, ownerId }) => {
      const db = openDatabase(connectionString)
      if (accessMode === 'read only') {
        db.exec('PRAGMA query_only = ON')
      }
      db.exec('BEGIN')
      const txId = registerTransaction(
        {
          commit: () => db.exec('COMMIT'),
          execute: (sql, values, options) =>
            Promise.resolve(runOn(db, sql, values, options)),
          release: () => db.close(),
          rollback: () => db.exec('ROLLBACK'),
        },
        ownerId
      )
      return Promise.resolve({ txId })
    }
  ),

  // The driver runs a statement synchronously, so it has finished before a cancel can arrive.
  cancel: () => Promise.resolve(),

  execute: handleQueryError(
    ({ connectionString, query: sql, values = [], ...options }) =>
      Promise.resolve(
        runOn(getDatabase(connectionString), sql, values, options)
      )
  ),
} satisfies QueryExecutor
