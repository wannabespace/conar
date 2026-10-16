import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Dialect as KyselyDialect } from 'kysely'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'

import type { DialectOptions } from '~/core/runtime/dialects/driver'
import { createKyselyDriver } from '~/core/runtime/dialects/driver'

export const postgresDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => createKyselyDriver(Dialect.Postgres, options),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new PostgresQueryCompiler(),
  }) satisfies KyselyDialect

export const postgresColdDialect = () =>
  ({
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new PostgresQueryCompiler(),
  }) satisfies KyselyDialect
