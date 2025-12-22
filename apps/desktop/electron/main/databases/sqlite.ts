import { DatabaseSync } from 'node:sqlite'
import { memoize } from '@conar/shared/utils/helpers'

export const getDatabase = memoize((connectionString: string) => {
  let filePath: string

  if (connectionString.startsWith('file://')) {
    const url = new URL(connectionString)
    filePath = url.pathname
    if (process.platform === 'win32' && /^\/[a-z]:/i.test(filePath)) {
      filePath = filePath.slice(1)
    }
  }
  else if (connectionString.startsWith('file:')) {
    filePath = connectionString.slice(5)
  }
  else {
    filePath = connectionString
  }

  const db = new DatabaseSync(filePath)
  db.exec('PRAGMA journal_mode = WAL')

  return db
})
