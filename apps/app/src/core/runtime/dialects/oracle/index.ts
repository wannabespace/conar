import { Dialect } from '@tamery/shared/enums/connection-type'
import type {
  AddColumnNode,
  AliasNode,
  AlterColumnNode,
  Dialect as KyselyDialect,
  LimitNode,
  ModifyColumnNode,
  OffsetNode,
  OperationNode,
  SelectQueryNode,
} from 'kysely'
import {
  DefaultQueryCompiler,
  DummyDriver,
  FromNode,
  JoinNode,
  RawNode,
  UpdateQueryNode,
} from 'kysely'

import type { DialectOptions } from '~/core/runtime/dialects/driver'
import { createKyselyDriver } from '~/core/runtime/dialects/driver'

const DUAL = FromNode.create([RawNode.createWithSql('dual')])

const namesTable = (parent: OperationNode | undefined) =>
  !!parent &&
  (FromNode.is(parent) || JoinNode.is(parent) || UpdateQueryNode.is(parent))

class OracleQueryCompiler extends DefaultQueryCompiler {
  protected override getCurrentParameterPlaceholder() {
    return `:${this.numParameters}`
  }

  // Oracle SQL before 23ai has no boolean literal.
  protected override appendImmediateValue(value: unknown) {
    super.appendImmediateValue(
      typeof value === 'boolean' ? Number(value) : value
    )
  }

  // A table alias takes no AS in Oracle; a column alias does.
  protected override visitAlias(node: AliasNode) {
    if (!namesTable(this.parentNode)) {
      super.visitAlias(node)
      return
    }
    this.visitNode(node.node)
    this.append(' ')
    this.visitNode(node.alias)
  }

  // OFFSET has to come before FETCH, and a SELECT without FROM before 23ai needs DUAL.
  protected override visitSelectQuery(node: SelectQueryNode) {
    super.visitSelectQuery({
      ...node,
      from: node.from ?? DUAL,
      limit: node.offset ? undefined : node.limit,
    })
  }

  protected override visitOffset(node: OffsetNode) {
    const { limit } = this.parentNode as SelectQueryNode
    this.append('offset ')
    this.visitNode(node.offset)
    this.append(' rows')
    if (limit) {
      this.append(' ')
      this.visitNode(limit)
    }
  }

  protected override visitLimit(node: LimitNode) {
    this.append('fetch next ')
    this.visitNode(node.limit)
    this.append(' rows only')
  }

  protected override visitAddColumn(node: AddColumnNode) {
    this.append('add (')
    this.visitNode(node.column)
    this.append(')')
  }

  protected override visitModifyColumn(node: ModifyColumnNode) {
    this.append('modify (')
    this.visitNode(node.column)
    this.append(')')
  }

  protected override visitAlterColumn(node: AlterColumnNode) {
    this.append('modify (')
    this.visitNode(node.column)
    if (node.dataType) {
      this.append(' ')
      this.visitNode(node.dataType)
    }
    if (node.setDefault) {
      this.append(' default ')
      this.visitNode(node.setDefault)
    }
    if (node.dropDefault) {
      this.append(' default null')
    }
    if (node.setNotNull) {
      this.append(' not null')
    }
    if (node.dropNotNull) {
      this.append(' null')
    }
    this.append(')')
  }

  // Oracle lists an ALTER TABLE's column clauses one after another, without commas.
  protected override compileColumnAlterations(
    columnAlterations: readonly OperationNode[]
  ) {
    this.compileList(columnAlterations, ' ')
  }
}

const oracleAdapter = () => ({
  acquireMigrationLock: () => Promise.resolve(),
  releaseMigrationLock: () => Promise.resolve(),
  supportsCreateIfNotExists: false,
  supportsReturning: false,
  supportsTransactionalDdl: false,
})

export const oracleDialect = (options: DialectOptions) =>
  ({
    createAdapter: oracleAdapter,
    createDriver: () => createKyselyDriver(Dialect.Oracle, options),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new OracleQueryCompiler(),
  }) satisfies KyselyDialect

export const oracleColdDialect = () =>
  ({
    createAdapter: oracleAdapter,
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
    createQueryCompiler: () => new OracleQueryCompiler(),
  }) satisfies KyselyDialect
