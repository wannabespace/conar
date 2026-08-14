import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Dialect } from 'kysely'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'

import type { DialectOptions } from '..'
import { createDialectProvider, createKyselyDriver } from '..'

export const postgresDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new PostgresAdapter(),
    createDriver: () =>
      createKyselyDriver({
        logger: options.log,
        provider: createDialectProvider(ConnectionType.Postgres, options),
      }),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new PostgresQueryCompiler(),
  }) satisfies Dialect

export const postgresColdDialect = () =>
  ({
    createAdapter: () => new PostgresAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new PostgresQueryCompiler(),
  }) satisfies Dialect
