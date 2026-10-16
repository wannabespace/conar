import type { DatabaseSync } from 'node:sqlite'

import { openDatabase } from './client'
import type {
  LocationTransaction,
  SqliteLocationQueries,
  SqliteValue,
  StatementResult,
} from './location'
import { toOutput } from './run'

/** A RETURNING write makes all its changes on the first step, so stopping past `maxRows` leaves nothing half done. */
const runOn = (
  db: DatabaseSync,
  texts: string[],
  values: SqliteValue[],
  maxRows: number
): StatementResult[] =>
  texts.map((text) => {
    const statement = db.prepare(text)
    // Not the constructor's readBigInts/returnArrays: Node 22.16, the CLI's floor, ignores them.
    statement.setReadBigInts(true)
    statement.setReturnArrays(true)
    const columns = statement.columns().map((column) => column.name)
    if (columns.length === 0) {
      return {
        changes: Number(statement.run(...values).changes),
        columns,
        rows: [],
      }
    }
    const rows = statement
      .iterate(...values)
      .take(maxRows + 1)
      .map((row) => Object.values(row).map(toOutput))
      .toArray()
    return { changes: null, columns, rows }
  })

const sessionOn = (db: DatabaseSync): LocationTransaction => ({
  commit: () => db.exec('COMMIT'),
  release: () => db.close(),
  rollback: () => db.exec('ROLLBACK'),
  run: (texts, values, maxRows) =>
    Promise.resolve(runOn(db, texts, values, maxRows)),
  status: () => Promise.resolve(db.isTransaction ? 'open' : 'ended'),
})

export const fileLocation = {
  openSession: (connectionString) => sessionOn(openDatabase(connectionString)),

  // A handle per call: a cached one keeps reading a file another tool deleted and recreated.
  run: (connectionString, texts, values, maxRows) => {
    using db = openDatabase(connectionString)
    return Promise.resolve(runOn(db, texts, values, maxRows))
  },

  // A transaction gets its own handle: on the shared one, every other query would run inside it.
  transaction: (connectionString, readOnly) => {
    const db = openDatabase(connectionString)
    if (readOnly) {
      db.exec('PRAGMA query_only = ON')
    }
    db.exec('BEGIN')
    return Promise.resolve(sessionOn(db))
  },
} satisfies SqliteLocationQueries
