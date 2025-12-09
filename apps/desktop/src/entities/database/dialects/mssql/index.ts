import type {
  CompiledQuery,
  Dialect,
  Driver,
  LimitNode,
  OffsetNode,
  OperationNode,
  QueryResult,
  SelectQueryNode,
} from 'kysely'
import type { databases } from '~/drizzle'
import { MssqlQueryCompiler as DefaultMssqlQueryCompiler, MssqlAdapter } from 'kysely'
import { logSql } from '../../sql'

function isSelectQueryNode(node: OperationNode): node is SelectQueryNode {
  return node.kind === 'SelectQueryNode'
}

class MssqlQueryCompiler extends DefaultMssqlQueryCompiler {
  protected override visitOffset(node: OffsetNode) {
    if (this.parentNode != null && isSelectQueryNode(this.parentNode) && this.parentNode.limit != null)
      return // will be handle when visitLimit

    this.append(' OFFSET ')
    this.visitNode(node.offset)
    this.append(' ROWS ')
  }

  protected override visitLimit(node: LimitNode): void {
    if (this.parentNode != null && isSelectQueryNode(this.parentNode)) {
      if (this.parentNode.offset != null) {
        this.append(' OFFSET ')
        this.visitNode(this.parentNode.offset.offset)
        this.append(' ROWS ')
      }
      else {
        this.append(' OFFSET 0 ROWS ')
      }
    }

    this.append(' FETCH NEXT ')
    this.visitNode(node.limit)
    this.append(' ROWS ONLY ')
  }
}

function execute(database: typeof databases.$inferSelect, compiledQuery: CompiledQuery) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mssql({
    connectionString: database.connectionString,
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  logSql(database, promise, {
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  return promise
}

function createDriver(database: typeof databases.$inferSelect) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(database, compiledQuery)

          return {
            rows: result as R[],
          }
        },
        streamQuery() {
          throw new Error('Not implemented')
        },
      }
    },
    async beginTransaction() {},
    async commitTransaction() {},
    async rollbackTransaction() {},
    async releaseConnection() {},
    async destroy() {},
  } satisfies Driver
}

export function mssqlDialect(database: typeof databases.$inferSelect) {
  return {
    createDriver: () => createDriver(database),
    createQueryCompiler: () => new MssqlQueryCompiler(),
    createAdapter: () => new MssqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
