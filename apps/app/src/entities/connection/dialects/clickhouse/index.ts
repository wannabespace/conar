import type { QueryExecutor } from '@conar/connection/queries'
import type { CompiledQuery, DatabaseConnection, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { type } from 'arktype'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'
import { orpcProxy } from '~/lib/orpc'

const escapeSqlStringRegex = /[\\']/g

function escapeSqlString(v: string) {
  return v.replace(escapeSqlStringRegex, '\\$&')
}

const dateStringType = type('string.date')

const compiledSqlRegex = /\?/g
const compiledSqlParameterRegex = /^update ((`\w+`\.)*`\w+`) set/i

function prepareQuery(compiledQuery: CompiledQuery) {
  let i = 0
  const compiledSql = compiledQuery.sql.replace(compiledSqlRegex, () => {
    const param = compiledQuery.parameters[i++]

    if (param === null || param === undefined) {
      return 'NULL'
    }

    if (Array.isArray(param)) {
      return `[${param.map(v =>
        v === null || v === undefined
          ? 'NULL'
          : typeof v === 'number'
            ? `${v}`
            : `'${escapeSqlString(String(v))}'`,
      ).join(', ')}]`
    }

    if (typeof param === 'number') {
      return `${param}`
    }

    if (param instanceof Date) {
      return `parseDateTime64BestEffort('${escapeSqlString(param.toISOString())}')`
    }

    if (typeof param !== 'string') {
      return `'${escapeSqlString(JSON.stringify(param))}'`
    }

    if (dateStringType.allows(param)) {
      return `parseDateTime64BestEffort('${escapeSqlString(param)}')`
    }

    return `'${escapeSqlString(param)}'`
  })

  return compiledSql.replace(
    compiledSqlParameterRegex,
    'alter table $1 update',
  )
}

function execute(options: DialectExecutionOptions) {
  const preparedQuery = prepareQuery(options.compiledQuery)

  const promise = window.electron
    ? window.electron.query.clickhouse.execute({
        connectionString: options.connectionString,
        query: preparedQuery,
      })
    : orpcProxy.query.clickhouse.execute.call(options.resourceId
        ? {
            resourceId: options.resourceId,
            query: preparedQuery,
          }
        : options.connectionId
          ? {
              connectionId: options.connectionId,
              query: preparedQuery,
            }
          : {
              connectionString: options.connectionString,
              query: preparedQuery,
            })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function executeInTransaction(options: DialectOptions & { txId: string, compiledQuery: CompiledQuery }) {
  const preparedQuery = prepareQuery(options.compiledQuery)

  const params: Parameters<QueryExecutor['executeTransaction']>[0] = {
    txId: options.txId,
    query: preparedQuery,
    values: [],
  }

  const promise = window.electron
    ? window.electron.query.clickhouse.executeTransaction(params)
    : orpcProxy.query.clickhouse.executeTransaction.call(params)

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
        ? window.electron.query.clickhouse.beginTransaction({
            connectionString: options.connectionString,
          })
        : orpcProxy.query.clickhouse.beginTransaction.call(options.resourceId
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
        ? window.electron.query.clickhouse.commitTransaction(params)
        : orpcProxy.query.clickhouse.commitTransaction.call(params))
    },
    async rollbackTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return

      const txId = state.txId
      state.txId = null
      const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
      await (window.electron
        ? window.electron.query.clickhouse.rollbackTransaction(params)
        : orpcProxy.query.clickhouse.rollbackTransaction.call(params))
    },
    async releaseConnection(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (state?.txId) {
        const txId = state.txId
        state.txId = null
        const params: Parameters<QueryExecutor['rollbackTransaction']>[0] = { txId }
        await (window.electron
          ? window.electron.query.clickhouse.rollbackTransaction(params)
          : orpcProxy.query.clickhouse.rollbackTransaction.call(params)).catch(() => {})
      }
    },
    async destroy() {},
  } satisfies Driver
}

function clickhouseAdapter() {
  return {
    supportsCreateIfNotExists: false,
    supportsTransactionalDdl: false,
    supportsReturning: false,
    acquireMigrationLock: async () => {},
    releaseMigrationLock: async () => {},
  }
}

export function clickhouseDialect(options: DialectOptions) {
  return {
    createAdapter: clickhouseAdapter,
    createDriver: () => createDriver(options),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}

export function clickhouseColdDialect() {
  return {
    createAdapter: clickhouseAdapter,
    createDriver: () => new DummyDriver(),
    createQueryCompiler: () => new MysqlQueryCompiler(),
    createIntrospector: () => {
      throw new Error('Not implemented')
    },
  } satisfies Dialect
}
