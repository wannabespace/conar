import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Dialect } from 'kysely'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'

import type { DialectOptions } from '..'
import { createDialectProvider, createKyselyDriver } from '..'

export const mysqlDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new MysqlAdapter(),
    createDriver: () =>
      createKyselyDriver({
        logger: options.log,
        provider: createDialectProvider(ConnectionType.MySQL, options),
      }),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MysqlQueryCompiler(),
  }) satisfies Dialect

export const mysqlColdDialect = () =>
  ({
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MysqlQueryCompiler(),
  }) satisfies Dialect
