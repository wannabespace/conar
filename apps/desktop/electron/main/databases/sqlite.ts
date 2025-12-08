import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const Database = createRequire(import.meta.url)('better-sqlite3') as typeof import('better-sqlite3')

export const getDatabase = memoize((connectionString: string) => {
  // Extract the file path from the connection string
  // Support both file:// and file: formats
  const filePath = connectionString
    .replace(/^file:\/\//, '')
    .replace(/^file:/, '')

  const db = new Database(filePath)

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL')

  return db
})
