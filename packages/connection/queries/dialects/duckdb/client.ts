import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

import { DuckDBInstance } from '@duckdb/node-api'
import { memoize } from 'memoza'

import { databaseFile } from '../../../database-file'

/**
 * An instance per call: DuckDB locks its file for as long as one is open, which would shut every other tool out. It
 * also creates a missing file, so a mistyped path is refused before it becomes an empty database.
 */
export const openFile = (connectionString: string) => {
  const stored = databaseFile.path(connectionString)
  const file = stored.startsWith('~/')
    ? path.join(homedir(), stored.slice(2))
    : stored
  if (!existsSync(file)) {
    throw new Error(`Cannot open file "${file}": No such file or directory`)
  }
  return DuckDBInstance.create(file)
}

/** A Quack server is reached from an in-memory instance of the client's own, which holds no file. */
export const quackClient = memoize(async () => {
  const instance = await DuckDBInstance.create(':memory:')
  const connection = await instance.connect()
  try {
    await connection.run('INSTALL quack; LOAD quack')
  } finally {
    connection.closeSync()
  }
  return instance
})
