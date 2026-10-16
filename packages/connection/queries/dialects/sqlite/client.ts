import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'

import { readConnectionString } from '../../../parse-connection-string'
import { sqliteFile } from '../../../sqlite-file'

// The driver waits for a lock synchronously, holding the desktop main process, so the wait stays short.
const BUSY_TIMEOUT_MS = 2000

/** `mode=rw` fails on a missing file instead of creating an empty database at a mistyped path. */
export const openDatabase = (connectionString: string) => {
  if (readConnectionString(connectionString).host) {
    throw new Error(
      'A SQLite connection opens a file on this computer, so its string names no host.'
    )
  }
  const url = pathToFileURL(sqliteFile.path(connectionString))
  url.searchParams.set('mode', 'rw')
  return new DatabaseSync(url, { timeout: BUSY_TIMEOUT_MS })
}
