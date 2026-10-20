import type {
  AddColumnNode,
  AliasNode,
  LimitNode,
  OffsetNode,
  OperationNode,
  SelectQueryNode,
} from 'kysely'
import {
  DefaultQueryCompiler,
  FromNode,
  JoinNode,
  RawNode,
  UpdateQueryNode,
} from 'kysely'

const DUAL = FromNode.create([RawNode.createWithSql('dual')])

const namesTable = (parent: OperationNode | undefined) =>
  !!parent &&
  (FromNode.is(parent) || JoinNode.is(parent) || UpdateQueryNode.is(parent))

export class OracleQueryCompiler extends DefaultQueryCompiler {
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
    super.visitOffset(node)
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
}
