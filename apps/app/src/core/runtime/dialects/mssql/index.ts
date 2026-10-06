import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Dialect, OffsetNode, SelectQueryNode } from 'kysely'
import {
  MssqlQueryCompiler as DefaultMssqlQueryCompiler,
  DummyDriver,
  MssqlAdapter,
  TopNode,
  ValueNode,
} from 'kysely'

import type { DialectOptions } from '~/core/runtime/dialects/driver'
import { createKyselyDriver } from '~/core/runtime/dialects/driver'

class MssqlQueryCompiler extends DefaultMssqlQueryCompiler {
  // A NULL parameter is typed nvarchar, which SQL Server refuses to convert to varbinary; a NULL literal converts to any type.
  protected override appendValue(value: unknown) {
    if (value === null) {
      this.append('null')
    } else {
      super.appendValue(value)
    }
  }

  // SQL Server has no LIMIT: a bare limit becomes TOP, and OFFSET … FETCH needs an ORDER BY.
  protected override visitSelectQuery(node: SelectQueryNode) {
    if (node.offset) {
      super.visitSelectQuery({ ...node, limit: undefined })
    } else if (node.limit && ValueNode.is(node.limit.limit)) {
      super.visitSelectQuery({
        ...node,
        limit: undefined,
        top: TopNode.create(Number(node.limit.limit.value)),
      })
    } else {
      super.visitSelectQuery(node)
    }
  }

  protected override visitOffset(node: OffsetNode) {
    const { limit, orderBy } = this.parentNode as SelectQueryNode

    if (!orderBy) {
      this.append('order by (select null) ')
    }
    super.visitOffset(node)
    if (limit) {
      this.append(' fetch next ')
      this.visitNode(limit.limit)
      this.append(' rows only')
    }
  }
}

export const mssqlDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new MssqlAdapter(),
    createDriver: () => createKyselyDriver(ConnectionType.MSSQL, options),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MssqlQueryCompiler(),
  }) satisfies Dialect

export const mssqlColdDialect = () =>
  ({
    createAdapter: () => new MssqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new MssqlQueryCompiler(),
  }) satisfies Dialect
