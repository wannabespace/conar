import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { AnyFunction } from '@conar/shared/utils/helpers'
import type { CompiledQuery, DatabaseConnection, Driver, QueryResult } from 'kysely'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import type { Database as MssqlDatabase } from './mssql/schema'
import type { Database as MysqlDatabase } from './mysql/schema'
import type { Database as PostgresDatabase } from './postgres/schema'
import { isLocalhostConnectionString } from '@conar/connection/utils'
import { memoize } from '@conar/memoize'
import { Kysely } from 'kysely'
import { orpcLocalProxy, orpcProxy } from '~/lib/orpc'
import { isLocalProxyAvailable } from '../local-proxy'
import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import { postgresColdDialect, postgresDialect } from './postgres'

export interface DialectOptions {
  connectionString: string
  connectionId?: string
  resourceId?: string
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
}

function resolveProxyIdParams(options: DialectOptions) {
  if (options.resourceId)
    return { resourceId: options.resourceId }
  if (options.connectionId)
    return { connectionId: options.connectionId }
  return { connectionString: options.connectionString }
}

interface QueryPayload {
  query: string
  values: unknown[]
}

interface TxQueryPayload extends QueryPayload {
  txId: string
}

export function createDialectProvider(type: ConnectionType, options: DialectOptions) {
  const electron = window.electron?.query[type]
  const useLocalProxy = !electron
    && isLocalProxyAvailable()
    && isLocalhostConnectionString(options.connectionString)
    && !!(options.connectionId || options.resourceId)
  const proxy = useLocalProxy ? orpcLocalProxy[type] : orpcProxy.query[type]

  return {
    execute(payload: QueryPayload) {
      if (electron)
        return electron.execute({ connectionString: options.connectionString, ...payload })
      return proxy.execute({ ...resolveProxyIdParams(options), ...payload })
    },
    beginTransaction() {
      if (electron)
        return electron.beginTransaction({ connectionString: options.connectionString })
      return proxy.beginTransaction(resolveProxyIdParams(options))
    },
    executeTransaction(params: TxQueryPayload) {
      return electron ? electron.executeTransaction(params) : proxy.executeTransaction(params)
    },
    commitTransaction(params: { txId: string }) {
      return electron ? electron.commitTransaction(params) : proxy.commitTransaction(params)
    },
    rollbackTransaction(params: { txId: string }) {
      return electron ? electron.rollbackTransaction(params) : proxy.rollbackTransaction(params)
    },
  }
}

export function createKyselyDriver({
  provider,
  logger,
  transformQuery = compiledQuery => ({
    query: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  }),
}: {
  provider: ReturnType<typeof createDialectProvider>
  logger?: DialectOptions['log']
  transformQuery?: (compiledQuery: CompiledQuery) => QueryPayload
}) {
  const txStates = new WeakMap<DatabaseConnection, { txId: string | null }>()

  function executeAndLog(compiledQuery: CompiledQuery) {
    const payload = transformQuery(compiledQuery)
    const promise = provider.execute(payload)
    logger?.({ promise, query: compiledQuery.sql, values: compiledQuery.parameters as unknown[] })
    return promise
  }

  function executeInTxAndLog(txId: string, compiledQuery: CompiledQuery) {
    const payload = transformQuery(compiledQuery)
    const promise = provider.executeTransaction({ txId, ...payload })
    logger?.({ promise, query: compiledQuery.sql, values: compiledQuery.parameters as unknown[] })
    return promise
  }

  return {
    async init() {},
    async acquireConnection() {
      const state: { txId: string | null } = { txId: null }
      const connection: DatabaseConnection = {
        executeQuery: async <R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> => {
          const { result } = state.txId
            ? await executeInTxAndLog(state.txId, compiledQuery)
            : await executeAndLog(compiledQuery)
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
      if (!state)
        throw new Error('Transaction state missing for acquired connection')

      const { txId } = await provider.beginTransaction()
      state.txId = txId
    },
    async commitTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return
      const { txId } = state
      state.txId = null
      await provider.commitTransaction({ txId })
    },
    async rollbackTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return
      const { txId } = state
      state.txId = null
      await provider.rollbackTransaction({ txId })
    },
    async releaseConnection(connection) {
      const state = txStates.get(connection)
      if (!state?.txId)
        return
      // Edge case: tx was never committed/rolled back explicitly.
      const { txId } = state
      state.txId = null
      await provider.rollbackTransaction({ txId }).catch(() => {})
    },
    async destroy() {},
  } satisfies Driver
}

export const dialects = {
  postgres: memoize((options: DialectOptions) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  mysql: memoize((options: DialectOptions) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  clickhouse: memoize((options: DialectOptions) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
  mssql: memoize((options: DialectOptions) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) }), {
    transformArgs: options => [options.connectionString, !!options.log],
  }),
} satisfies Record<ConnectionType, AnyFunction>

export const coldDialects = {
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
} satisfies Record<ConnectionType, AnyFunction>
