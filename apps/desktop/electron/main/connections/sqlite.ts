import { createRequire } from 'node:module'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { memoize } from '@conar/shared/utils/helpers'

const Database = createRequire(import.meta.url)('better-sqlite3') as typeof import('better-sqlite3')

function toFilePath(connectionString: string): string {
  const trimmed = connectionString.trim()
  if (trimmed.startsWith('file://'))
    return fileURLToPath(trimmed)
  return isAbsolute(trimmed) ? trimmed : resolve(process.cwd(), trimmed)
}

const getDatabaseByPath = memoize((filePath: string) => new Database(filePath))

export function getDatabase(connectionString: string) {
  return getDatabaseByPath(toFilePath(connectionString))
}
