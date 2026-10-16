import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Dialect as KyselyDialect } from 'kysely'
import { DummyDriver, SqliteAdapter, SqliteQueryCompiler } from 'kysely'

import type { DialectOptions } from '~/core/runtime/dialects/driver'
import { createKyselyDriver } from '~/core/runtime/dialects/driver'

export const sqliteDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => createKyselyDriver(Dialect.SQLite, options),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new SqliteQueryCompiler(),
  }) satisfies KyselyDialect

export const sqliteColdDialect = () =>
  ({
    createAdapter: () => new SqliteAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new SqliteQueryCompiler(),
  }) satisfies KyselyDialect
