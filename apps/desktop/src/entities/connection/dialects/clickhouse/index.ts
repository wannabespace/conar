import type { CompiledQuery, DatabaseConnection, Dialect, Driver, QueryResult } from 'kysely'
import type { DialectExecutionOptions, DialectOptions } from '..'
import { type } from 'arktype'
import { DummyDriver, MysqlQueryCompiler } from 'kysely'

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
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const preparedQuery = prepareQuery(options.compiledQuery)

  const promise = window.electron.query.clickhouse.execute({
    connectionString: options.connectionString,
    query: preparedQuery,
  })

  options.log?.({ promise, query: options.compiledQuery.sql, values: options.compiledQuery.parameters as unknown[] })

  return promise
}

function executeInTransaction(options: DialectOptions & { txId: string, compiledQuery: CompiledQuery }) {
  if (!window.electron) {
    throw new Error('Electron is not available')
  }

  const preparedQuery = prepareQuery(options.compiledQuery)

  const promise = window.electron.query.clickhouse.executeTransaction({
    txId: options.txId,
    query: preparedQuery,
    values: [],
  })

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
      // ClickHouse does not support real multi-statement transactions.
      // We still allocate a tx id so Kysely's transaction API works uniformly,
      // but commit/rollback on the server side are no-ops.
      if (!window.electron) {
        throw new Error('Electron is not available')
      }

      const state = txStates.get(connection)
      if (!state) {
        throw new Error('Transaction state missing for acquired connection')
      }

      const { txId } = await window.electron.query.clickhouse.beginTransaction({
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
      await window.electron.query.clickhouse.commitTransaction({ txId })
    },
    async rollbackTransaction(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (!state?.txId || !window.electron)
        return

      const txId = state.txId
      state.txId = null
      await window.electron.query.clickhouse.rollbackTransaction({ txId })
    },
    async releaseConnection(connection: DatabaseConnection) {
      const state = txStates.get(connection)
      if (state?.txId && window.electron) {
        const txId = state.txId
        state.txId = null
        await window.electron.query.clickhouse.rollbackTransaction({ txId }).catch(() => {})
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
