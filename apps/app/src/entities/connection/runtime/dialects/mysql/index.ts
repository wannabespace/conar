import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Dialect } from 'kysely'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'

import type { DialectOptions } from '..'
import { createDialectProvider, createKyselyDriver } from '..'

export function mysqlDialect(options: DialectOptions) {
  return {
    createDriver: () =>
      createKyselyDriver({
        provider: createDialectProvider(ConnectionType.MySQL, options),
        logger: options.log,
      }),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function mysqlColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
