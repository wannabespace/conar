import type { QueryExecutor } from '@conar/connection/queries'
import type { CompiledQuery, DatabaseConnection, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { DummyDriver, PostgresAdapter, PostgresQueryCompiler } from 'kysely'
import { orpc } from '~/lib/orpc'

function execute(options: DialectExecutionOptions) {
  const params: Parameters<QueryExecutor['execute']>[0] = {
    connectionString: options.connectionString,
    query: options.compiledQuery.sql,
    values: options.compiledQuery.parameters as unknown[],
  }

  const promise = window.electron
    ? window.electron.query.postgres.execute(params)
    : orpc.proxy.query.postgres.execute.call(params)

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
    ? window.electron.query.postgres.executeTransaction(params)
    : orpc.proxy.query.postgres.executeTransaction.call(params)

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
    async beginTransaction(connection) {
      const state = txStates.get(connection)
      if (!state) {
        throw new Error('Transaction state missing for acquired connection')
      }

      const params: Parameters<QueryExecutor['beginTransaction']>[0] = {
        connectionString: options.connectionString,
      }

      const { txId } = await (window.electron
        ? window.electron.query.postgres.beginTransaction(params)
        : orpc.proxy.query.postgres.beginTransaction.call(params))

      state.txId = txId
    },
    async commitTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null

      const params: Parameters<QueryExecutor['commitTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.postgres.commitTransaction(params)
        : orpc.proxy.query.postgres.commitTransaction.call(params))
    },
    async rollbackTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null

      const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.postgres.rollbackTransaction(params)
        : orpc.proxy.query.postgres.rollbackTransaction.call(params))
    },
    async releaseConnection(connection) {
      const state = txStates.get(connection)
      if (state?.txId) {
        // Edge case: tx was never committed/rolled back explicitly.
        const txId = state.txId
        state.txId = null
        const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
        await (window.electron
          ? window.electron.query.postgres.rollbackTransaction(params)
          : orpc.proxy.query.postgres.rollbackTransaction.call(params)).catch(() => {})
      }
    },
    async destroy() {},
  } satisfies Driver
}

export function postgresDialect(options: DialectOptions) {
  return {
    createDriver: () => createDriver(options),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function postgresColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new PostgresQueryCompiler(),
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
