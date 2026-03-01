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
import type { DialectExecutionOptions, DialectOptions } from '..'
import { MssqlQueryCompiler as DefaultMssqlQueryCompiler, DummyDriver, MssqlAdapter } from 'kysely'

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

function execute(options: DialectExecutionOptions) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mssql({
    connectionString: options.connectionString,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
    silent: options.silent,
  })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function createDriver(options: DialectOptions) {
  return {
    async init() {},
    async acquireConnection() {
      return {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = await execute({ ...options, compiledQuery })

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

export function mssqlDialect(options: DialectOptions) {
  return {
    createDriver: () => createDriver(options),
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
