import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Dialect } from 'kysely'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'

import type { DialectOptions } from '../driver'
import { createKyselyDriver } from '../driver'

export const mysqlDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => createKyselyDriver(ConnectionType.MySQL, options),
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
