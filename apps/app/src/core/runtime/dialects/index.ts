import { prepareQuery } from '@tamery/connection/queries/dialects/clickhouse/prepare-query'
import { kyselyDialects } from '@tamery/connection/queries/kysely'
import { Dialect } from '@tamery/shared/enums/connection-type'
import type { AnyFunction } from '@tamery/shared/utils'
import { Kysely } from 'kysely'
import { memoize } from 'memoza'

import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { DialectOptions } from './driver'
import { createKyselyDriver } from './driver'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import type { Database as SqliteDatabase } from './sqlite/schema'

const byConnection = {
  cacheKey: ({ log: _log, ...rest }: DialectOptions) => rest,
}

export const dialects = {
  clickhouse: memoize(
    (options: DialectOptions) =>
      new Kysely<ClickhouseDatabase>({
        dialect: {
          ...kyselyDialects.clickhouse,
          createDriver: () =>
            createKyselyDriver(
              Dialect.ClickHouse,
              options,
              (compiledQuery) => ({
                query: prepareQuery(compiledQuery),
                values: [],
              })
            ),
        },
      }),
    byConnection
  ),
  mssql: memoize(
    (options: DialectOptions) =>
      new Kysely<MssqlDatabase>({
        dialect: {
          ...kyselyDialects.mssql,
          createDriver: () => createKyselyDriver(Dialect.MSSQL, options),
        },
      }),
    byConnection
  ),
  mysql: memoize(
    (options: DialectOptions) =>
      new Kysely<MysqlDatabase>({
        dialect: {
          ...kyselyDialects.mysql,
          createDriver: () => createKyselyDriver(Dialect.MySQL, options),
        },
      }),
    byConnection
  ),
  postgres: memoize(
    (options: DialectOptions) =>
      new Kysely<PostgresDatabase>({
        dialect: {
          ...kyselyDialects.postgres,
          createDriver: () => createKyselyDriver(Dialect.Postgres, options),
        },
      }),
    byConnection
  ),
  sqlite: memoize(
    (options: DialectOptions) =>
      new Kysely<SqliteDatabase>({
        dialect: {
          ...kyselyDialects.sqlite,
          createDriver: () => createKyselyDriver(Dialect.SQLite, options),
        },
      }),
    byConnection
  ),
} satisfies Record<Dialect, AnyFunction>
