import type { Dialect } from 'kysely'
import type { DialectOptions } from '..'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'
import { createDialectProvider, createKyselyDriver } from '..'

export function postgresDialect(options: DialectOptions) {
  return {
    createDriver: () => createKyselyDriver({
      provider: createDialectProvider(ConnectionType.Postgres, options),
      logger: options.log,
    }),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function postgresColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
