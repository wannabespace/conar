import type { CompiledQuery, Dialect, Driver, QueryResult } from 'kysely'
import type { databases } from '~/drizzle'
import { logSql } from '../../sql'

function execute(database: typeof databases.$inferSelect, compiledQuery: CompiledQuery) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.sqlite({
    connectionString: database.connectionString,
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  logSql(database, promise, {
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  return promise
}

function createDriver(database: typeof databases.$inferSelect) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(database, compiledQuery)

          return {
            rows: result as R[],
          }
        },
        streamQuery() {
          throw new Error('Not implemented')
        },
      }
    },
    async beginTransaction() {},
    async commitTransaction() {},
    async rollbackTransaction() {},
    async releaseConnection() {},
    async destroy() {},
  } satisfies Driver
}

// SQLite uses similar SQL syntax to PostgreSQL for most queries
// We'll create a minimal adapter and compiler for SQLite
class SqliteAdapter {
  get supportsTransactionalDdl() {
    return true
  }

  get supportsReturning() {
    // SQLite 3.35.0+ supports RETURNING for INSERT/UPDATE/DELETE
    // For now, we'll indicate limited support is available
    return false
  }
}

class SqliteQueryCompiler {
  // Most of SQLite query compilation can use generic SQL syntax
  // This is a placeholder - Kysely will use its default compilation
}

export function sqliteDialect(database: typeof databases.$inferSelect) {
  return {
    createDriver: () => createDriver(database),
    // eslint-disable-next-line ts/no-explicit-any
    createQueryCompiler: () => new SqliteQueryCompiler() as any,
    // eslint-disable-next-line ts/no-explicit-any
    createAdapter: () => new SqliteAdapter() as any,
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
