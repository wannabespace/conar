import { Dialect } from '@tamery/shared/enums/connection-type'
import type { CompiledQuery, Dialect as KyselyDialect } from 'kysely'
import {
  DummyDriver,
  Kysely,
  MssqlAdapter,
  MysqlAdapter,
  MysqlQueryCompiler,
  PostgresAdapter,
  PostgresQueryCompiler,
  SqliteAdapter,
  SqliteQueryCompiler,
} from 'kysely'
import { memoize } from 'memoza'

import { prepareQuery } from './dialects/clickhouse/prepare-query'
import { MssqlQueryCompiler } from './dialects/mssql/query-compiler'

const createIntrospector = () => {
  throw new Error('Not implemented')
}

const clickhouseAdapter = () => ({
  acquireMigrationLock: () => Promise.resolve(),
  releaseMigrationLock: () => Promise.resolve(),
  supportsCreateIfNotExists: false,
  supportsReturning: false,
  supportsTransactionalDdl: false,
})

export const kyselyDialects = {
  clickhouse: {
    createAdapter: clickhouseAdapter,
    createIntrospector,
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
  mssql: {
    createAdapter: () => new MssqlAdapter(),
    createIntrospector,
    createQueryCompiler: () => new MssqlQueryCompiler(),
  },
  mysql: {
    createAdapter: () => new MysqlAdapter(),
    createIntrospector,
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
  postgres: {
    createAdapter: () => new PostgresAdapter(),
    createIntrospector,
    createQueryCompiler: () => new PostgresQueryCompiler(),
  },
  sqlite: {
    createAdapter: () => new SqliteAdapter(),
    createIntrospector,
    createQueryCompiler: () => new SqliteQueryCompiler(),
  },
} satisfies Record<Dialect, Omit<KyselyDialect, 'createDriver'>>

/** Compile-only: executing on one fails. Run what it compiles through `toQueryPayload`. */
export const coldDialect = memoize(
  (dialect: Dialect) =>
    new Kysely({
      dialect: {
        ...kyselyDialects[dialect],
        createDriver: () => new DummyDriver(),
      },
    })
)

/** What an executor runs for a compiled statement: ClickHouse takes its values inlined. */
export const toQueryPayload = (dialect: Dialect, compiled: CompiledQuery) =>
  dialect === Dialect.ClickHouse
    ? { query: prepareQuery(compiled), values: [] }
    : { query: compiled.sql, values: [...compiled.parameters] }
