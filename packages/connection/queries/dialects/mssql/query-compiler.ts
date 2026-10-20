import type { OffsetNode, SelectQueryNode } from 'kysely'
import {
  MssqlQueryCompiler as DefaultMssqlQueryCompiler,
  TopNode,
  ValueNode,
} from 'kysely'

export class MssqlQueryCompiler extends DefaultMssqlQueryCompiler {
  // A NULL parameter is typed nvarchar, which SQL Server refuses to convert to varbinary.
  protected override appendValue(value: unknown) {
    if (value === null) {
      this.append('null')
    } else {
      super.appendValue(value)
    }
  }

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
