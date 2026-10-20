import type { Dialect } from '@tamery/shared/enums/connection-type'
import type { Dialect as KyselyDialect } from 'kysely'
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

/** How each engine's statements are spelled; a dialect adds its own `createDriver`. */
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

const coldDialect = (spelling: Omit<KyselyDialect, 'createDriver'>) =>
  memoize(
    () =>
      new Kysely({
        dialect: { ...spelling, createDriver: () => new DummyDriver() },
      })
  )

/** Compile-only: executing on one fails. ClickHouse's statements still go through `prepareQuery`. */
export const coldDialects = {
  clickhouse: coldDialect(kyselyDialects.clickhouse),
  mssql: coldDialect(kyselyDialects.mssql),
  mysql: coldDialect(kyselyDialects.mysql),
  postgres: coldDialect(kyselyDialects.postgres),
  sqlite: coldDialect(kyselyDialects.sqlite),
} satisfies Record<Dialect, () => Kysely<unknown>>
