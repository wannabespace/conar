import { DatabaseSync } from 'node:sqlite'
import { memoize } from '@conar/shared/utils/helpers'

export const getDatabase = memoize((connectionString: string) => {
  // Extract the file path from the connection string
  // Support both file:// and file: formats, as well as plain file paths
  let filePath: string

  if (connectionString.startsWith('file://')) {
    // Use URL to properly parse file:// URIs
    const url = new URL(connectionString)
    filePath = url.pathname
    // On Windows, pathname includes leading slash that needs to be removed
    if (process.platform === 'win32' && /^\/[a-z]:/i.test(filePath)) {
      filePath = filePath.slice(1)
    }
  }
  else if (connectionString.startsWith('file:')) {
    filePath = connectionString.slice(5)
  }
  else {
    // Assume it's already a file path
    filePath = connectionString
  }

  const db = new DatabaseSync(filePath)

  // Enable WAL mode for better concurrent access
  db.exec('PRAGMA journal_mode = WAL')

  return db
})
