import type { Dialect } from 'kysely'
import type { DialectOptions } from '..'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'
import { createDialectProvider, createKyselyDriver } from '..'

export function mysqlDialect(options: DialectOptions) {
  return {
    createDriver: () => createKyselyDriver({
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
