import type { QueryExecutor } from '@conar/connection/queries'
import type { CompiledQuery, DatabaseConnection, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { DummyDriver, MysqlAdapter, MysqlQueryCompiler } from 'kysely'
import { orpcProxy } from '~/lib/orpc'

function execute(options: DialectExecutionOptions) {
  const promise = window.electron
    ? window.electron.query.mysql.execute({
        connectionString: options.connectionString,
        query: options.compiledQuery.sql,
        values: options.compiledQuery.parameters as unknown[],
      })
    : orpcProxy.query.mysql.execute.call(options.resourceId
        ? {
            resourceId: options.resourceId,
            query: options.compiledQuery.sql,
            values: options.compiledQuery.parameters as unknown[],
          }
        : options.connectionId
          ? {
              connectionId: options.connectionId,
              query: options.compiledQuery.sql,
              values: options.compiledQuery.parameters as unknown[],
            }
          : {
              connectionString: options.connectionString,
              query: options.compiledQuery.sql,
              values: options.compiledQuery.parameters as unknown[],
            })

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
    ? window.electron.query.mysql.executeTransaction(params)
    : orpcProxy.query.mysql.executeTransaction.call(params)

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

      const { txId } = await (window.electron
        ? window.electron.query.mysql.beginTransaction({
            connectionString: options.connectionString,
          })
        : orpcProxy.query.mysql.beginTransaction.call(options.resourceId
            ? {
                resourceId: options.resourceId,
              }
            : options.connectionId
              ? {
                  connectionId: options.connectionId,
                }
              : {
                  connectionString: options.connectionString,
                }))

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
        ? window.electron.query.mysql.commitTransaction(params)
        : orpcProxy.query.mysql.commitTransaction.call(params))
    },
    async rollbackTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null

      const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.mysql.rollbackTransaction(params)
        : orpcProxy.query.mysql.rollbackTransaction.call(params))
    },
    async releaseConnection(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (state?.txId) {
        const txId = state.txId
        state.txId = null
        const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
        await (window.electron
          ? window.electron.query.mysql.rollbackTransaction(params)
          : orpcProxy.query.mysql.rollbackTransaction.call(params)).catch(() => {})
      }
    },
    async destroy() {},
  } satisfies Driver
}

export function mysqlDialect(options: DialectOptions) {
  return {
    createDriver: () => createDriver(options),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function mysqlColdDialect() {
  return {
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createAdapter: () => new MysqlAdapter(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
