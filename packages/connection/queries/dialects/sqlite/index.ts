import type { DatabaseSync } from 'node:sqlite'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { registerTransaction, transactionQueries } from '../../transactions'
import { getDatabase, openDatabase } from './client'
import { runOn } from './run'

const register = (db: DatabaseSync, ownerId?: string) =>
  registerTransaction(
    {
      commit: () => db.exec('COMMIT'),
      execute: (sql, values, options) =>
        Promise.resolve(runOn(db, sql, values, options)),
      release: () => db.close(),
      rollback: () => db.exec('ROLLBACK'),
      status: () => Promise.resolve(db.isTransaction ? 'open' : 'ended'),
    },
    ownerId
  )

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
      return Promise.resolve({ txId: register(db, ownerId) })
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

  openSession: handleQueryError(({ connectionString, ownerId }) =>
    Promise.resolve({ txId: register(openDatabase(connectionString), ownerId) })
  ),
} satisfies QueryExecutor
