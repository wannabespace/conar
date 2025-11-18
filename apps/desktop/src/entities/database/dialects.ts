import type { CompiledQuery, Driver, QueryResult } from 'kysely'
import type { databases } from '~/drizzle'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { MysqlDialect, PostgresDialect } from 'kysely'

// Based on https://kysely.dev/docs/runtimes/browser

class ProxyDriver implements Driver {
  constructor(private readonly database: typeof databases.$inferSelect) {}

  async init() {}

  async acquireConnection() {
    return {
      executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
        const { result } = await window.electron!.sql[this.database.type]({
          sql: compiledQuery.sql,
          values: compiledQuery.parameters as unknown[],
          connectionString: this.database.connectionString,
        })

        return {
          rows: result as R[],
        }
      },
      streamQuery() {
        throw new Error('Not implemented')
      },
    }
  }

  async beginTransaction() {}
  async commitTransaction() {}
  async rollbackTransaction() {}
  async releaseConnection() {}
  async destroy() {}
}

const dialectMap = {
  [DatabaseType.Postgres]: PostgresDialect,
  [DatabaseType.MySQL]: MysqlDialect,
}

export function createDialect<D extends typeof databases.$inferSelect>(database: D) {
  class ProxyDialect extends dialectMap[database.type] {
    constructor(private readonly database: D) {
      // eslint-disable-next-line ts/no-explicit-any
      super({} as any)
    }

    createDriver() {
      return new ProxyDriver(this.database)
    }
  }

  return new ProxyDialect(database) as InstanceType<typeof dialectMap[D['type']]>
}
