import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type {
  Dialect,
  LimitNode,
  OffsetNode,
  OperationNode,
  SelectQueryNode,
} from 'kysely'
import {
  MssqlQueryCompiler as DefaultMssqlQueryCompiler,
  DummyDriver,
  MssqlAdapter,
} from 'kysely'

import type { DialectOptions } from '..'
import { createDialectProvider, createKyselyDriver } from '..'

const isSelectQueryNode = (node: OperationNode): node is SelectQueryNode =>
  node.kind === 'SelectQueryNode'

class MssqlQueryCompiler extends DefaultMssqlQueryCompiler {
  protected override visitOffset(node: OffsetNode) {
    const parent = this.parentNode

    if (parent && isSelectQueryNode(parent) && parent.limit) {
      return
    }

    this.append(' OFFSET ')
    this.visitNode(node.offset)
    this.append(' ROWS ')
  }

  protected override visitLimit(node: LimitNode): void {
    const parent = this.parentNode

    if (parent && isSelectQueryNode(parent)) {
      if (parent.offset) {
        this.append(' OFFSET ')
        this.visitNode(parent.offset.offset)
        this.append(' ROWS ')
      } else {
        this.append(' OFFSET 0 ROWS ')
      }
    }

    this.append(' FETCH NEXT ')
    this.visitNode(node.limit)
    this.append(' ROWS ONLY ')
  }
}

export const mssqlDialect = (options: DialectOptions) =>
  ({
    createAdapter: () => new MssqlAdapter(),
    createDriver: () =>
      createKyselyDriver({
        logger: options.log,
        provider: createDialectProvider(ConnectionType.MSSQL, options),
      }),
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
