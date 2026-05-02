import type { QueryExecutor } from '@conar/connection/queries'
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
import { orpc } from '~/lib/orpc'

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
  const params: Parameters<QueryExecutor['execute']>[0] = {
    connectionString: options.connectionString,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
  }

  const promise = window.electron
    ? window.electron.query.mssql.execute(params)
    : orpc.proxy.query.mssql.execute.call(params)

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function executeInTransaction(options: DialectOptions & { txId: string, compiledQuery: CompiledQuery }) {
  const params: Parameters<QueryExecutor['executeTransaction']>[0] = {
    txId: options.txId,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
  }

  const promise = window.electron
    ? window.electron.query.mssql.executeTransaction(params)
    : orpc.proxy.query.mssql.executeTransaction.call(params)

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function createDriver(options: DialectOptions) {
  const txStates = new WeakMap<DatabaseConnection, { txId: string | null }>()

  return {
    async init() {},
    async acquireConnection() {
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
      const state = txStates.get(connection)
      if (!state) {
        throw new Error('Transaction state missing for acquired connection')
      }

      const params: Parameters<QueryExecutor['beginTransaction']>[0] = {
        connectionString: options.connectionString,
      }

      const { txId } = await (window.electron
        ? window.electron.query.mssql.beginTransaction(params)
        : orpc.proxy.query.mssql.beginTransaction.call(params))

      state.txId = txId
    },
    async commitTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null

      const params: Parameters<QueryExecutor['commitTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.mssql.commitTransaction(params)
        : orpc.proxy.query.mssql.commitTransaction.call(params))
    },
    async rollbackTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null

      const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.mssql.rollbackTransaction(params)
        : orpc.proxy.query.mssql.rollbackTransaction.call(params))
    },
    async releaseConnection(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (state?.txId) {
        const txId = state.txId
        state.txId = null
        const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
        await (window.electron
          ? window.electron.query.mssql.rollbackTransaction(params)
          : orpc.proxy.query.mssql.rollbackTransaction.call(params)).catch(() => {})
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
