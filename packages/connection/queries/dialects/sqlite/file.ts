import type { DatabaseSync } from 'node:sqlite'

import { handleQueryError } from '../..'
import { registerTransaction } from '../../transactions'
import { openDatabase } from './client'
import type { LocationQueries } from './location'
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

export const fileQuery = {
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

  // A handle per call: a cached one keeps reading a file another tool deleted and recreated.
  execute: handleQueryError(
    ({ connectionString, query: sql, values = [], ...options }) => {
      const db = openDatabase(connectionString)
      try {
        return Promise.resolve(runOn(db, sql, values, options))
      } finally {
        db.close()
      }
    }
  ),

  openSession: handleQueryError(({ connectionString, ownerId }) =>
    Promise.resolve({ txId: register(openDatabase(connectionString), ownerId) })
  ),
} satisfies LocationQueries
