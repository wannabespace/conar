import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const { DuckDBInstance } = createRequire(import.meta.url)('@duckdb/node-api') as typeof import('@duckdb/node-api')

const DUCKDB_WINDOWS_PATH_PREFIX = /^\/([a-z]:)/i

function resolveDuckDbPath(connectionString: string) {
  const trimmed = connectionString.trim()

  if (!trimmed.startsWith('duckdb:')) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    return url.searchParams.get('path') || (url.pathname === '/' ? trimmed : url.pathname.replace(DUCKDB_WINDOWS_PATH_PREFIX, '$1')) || trimmed
  }
  catch {
    return trimmed
  }
}

const getDuckDbInstance = memoize(async (databasePath: string) => {
  return DuckDBInstance.create(databasePath)
})

export async function getConnection(connectionString: string) {
  const instance = await getDuckDbInstance(resolveDuckDbPath(connectionString))
  return instance.connect()
}
