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
import type { DialectOptions } from '..'
import type { connections } from '~/drizzle'
import { MssqlQueryCompiler as DefaultMssqlQueryCompiler, DummyDriver, MssqlAdapter } from 'kysely'
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

function execute(connection: typeof connections.$inferSelect, compiledQuery: CompiledQuery, options?: DialectOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mssql({
    connectionString: connection.connectionString,
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
    silent: options?.silent,
  })

  logSql(connection, promise, {
    sql: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })

  return promise
}

function createDriver(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute(connection, compiledQuery, options)

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

export function mssqlDialect(connection: typeof connections.$inferSelect, options?: DialectOptions) {
  return {
    createDriver: () => createDriver(connection, options),
    createQueryCompiler: () => new MssqlQueryCompiler(),
    createAdapter: () => new MssqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function mssqlColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MssqlQueryCompiler(),
    createAdapter: () => new MssqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
