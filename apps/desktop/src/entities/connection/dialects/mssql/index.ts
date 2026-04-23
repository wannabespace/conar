import type {
  CompiledQuery,
  DatabaseConnection,
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

  const promise = window.electron.query.mssql.execute({
    connectionString: options.connectionString,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
  })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function executeInTransaction(options: DialectOptions & { txId: string, compiledQuery: CompiledQuery }) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const promise = window.electron.query.mssql.executeTransaction({
    txId: options.txId,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
  })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function createDriver(options: DialectOptions) {
  const txStates = new WeakMap<DatabaseConnection, { txId: string | null }>()

  return {
    async init() {},
    async acquireConnection(): Promise<DatabaseConnection> {
      const state: { txId: string | null } = { txId: null }
      const connection: DatabaseConnection = {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          if (state.txId) {
            const { result } = await executeInTransaction({ ...options, txId: state.txId, compiledQuery })
            return { rows: Array.isArray(result) ? result as R[] : [] }
          }

          const { result } = await execute({ ...options, compiledQuery })
          return { rows: Array.isArray(result) ? result as R[] : [] }
        },
        streamQuery() {
          throw new Error('Not implemented')
        },
      }
      txStates.set(connection, state)
      return connection
    },
    async beginTransaction(connection: DatabaseConnection) {
      if (!window.electron) {
        throw new Error('Electron is not available')
      }

      const state = txStates.get(connection)
      if (!state) {
        throw new Error('Transaction state missing for acquired connection')
      }

      const { txId } = await window.electron.query.mssql.beginTransaction({
        connectionString: options.connectionString,
      })

      state.txId = txId
    },
    async commitTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId || !window.electron)
        return

      const txId = state.txId
      state.txId = null
      await window.electron.query.mssql.commitTransaction({ txId })
    },
    async rollbackTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId || !window.electron)
        return

      const txId = state.txId
      state.txId = null
      await window.electron.query.mssql.rollbackTransaction({ txId })
    },
    async releaseConnection(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (state?.txId && window.electron) {
        const txId = state.txId
        state.txId = null
        await window.electron.query.mssql.rollbackTransaction({ txId }).catch(() => {})
      }
    },
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
