import type { ConnectionType } from '@conar/shared/enums/connection-type'
import { PORTS } from '@conar/shared/ports'
import type { AnyFunction } from '@conar/shared/utils/helpers'
import type { CompiledQuery, DatabaseConnection, Driver, QueryResult } from 'kysely'
import { Kysely } from 'kysely'
import { memoize } from 'memoza'

import { getCollections } from '~/entities/collections'
import { createProxyClient, orpcProxy } from '~/lib/orpc'

import { getConnectionStore } from '../../store'
import { fetchingConfig } from '../../utils'
import { clickhouseColdDialect, clickhouseDialect } from './clickhouse'
import type { Database as ClickhouseDatabase } from './clickhouse/schema'
import { mssqlColdDialect, mssqlDialect } from './mssql'
import type { Database as MssqlDatabase } from './mssql/schema'
import { mysqlColdDialect, mysqlDialect } from './mysql'
import type { Database as MysqlDatabase } from './mysql/schema'
import { postgresColdDialect, postgresDialect } from './postgres'
import type { Database as PostgresDatabase } from './postgres/schema'

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
  if (options.resourceId) return { resourceId: options.resourceId }
  if (options.connectionId) return { connectionId: options.connectionId }
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
  const { connectionsCollection, connectionsResourcesCollection } = getCollections()
  const resource = options.resourceId ? connectionsResourcesCollection.get(options.resourceId) : null
  const connectionId = options.connectionId || resource?.connectionId
  const connection = connectionId ? connectionsCollection.get(connectionId) : null

  function resolveTransport() {
    const proxy = connectionId ? getConnectionStore(connectionId).get().proxy : { enabled: false, url: null }
    const config = connection ? fetchingConfig(connection, { proxy }) : null

    if (config?.type === 'proxy') {
      const client = createProxyClient(proxy.url || `http://localhost:${PORTS.LOCAL_PROXY}`)
      return { kind: 'proxy' as const, proxy: client[type] }
    }

    const electron = window.electron?.query[type]
    if (electron) {
      return { kind: 'electron' as const, electron }
    }

    return { kind: 'cloud-proxy' as const, proxy: orpcProxy.query[type] }
  }

  return {
    execute(payload: QueryPayload) {
      const t = resolveTransport()
      if (t.kind === 'electron') return t.electron.execute({ connectionString: options.connectionString, ...payload })
      return t.proxy.execute({ ...resolveProxyIdParams(options), ...payload })
    },
    beginTransaction() {
      const t = resolveTransport()
      if (t.kind === 'electron') return t.electron.beginTransaction({ connectionString: options.connectionString })
      return t.proxy.beginTransaction(resolveProxyIdParams(options))
    },
    executeTransaction(params: TxQueryPayload) {
      const t = resolveTransport()
      return t.kind === 'electron' ? t.electron.executeTransaction(params) : t.proxy.executeTransaction(params)
    },
    commitTransaction(params: { txId: string }) {
      const t = resolveTransport()
      return t.kind === 'electron' ? t.electron.commitTransaction(params) : t.proxy.commitTransaction(params)
    },
    rollbackTransaction(params: { txId: string }) {
      const t = resolveTransport()
      return t.kind === 'electron' ? t.electron.rollbackTransaction(params) : t.proxy.rollbackTransaction(params)
    },
  }
}

export function createKyselyDriver({
  provider,
  logger,
  transformQuery = (compiledQuery) => ({
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
          const { result } = state.txId ? await executeInTxAndLog(state.txId, compiledQuery) : await executeAndLog(compiledQuery)
          return { rows: Array.isArray(result) ? (result as R[]) : [] }
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
      if (!state) throw new Error('Transaction state missing for acquired connection')

      const { txId } = await provider.beginTransaction()
      state.txId = txId
    },
    async commitTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) return
      const { txId } = state
      state.txId = null
      await provider.commitTransaction({ txId })
    },
    async rollbackTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) return
      const { txId } = state
      state.txId = null
      await provider.rollbackTransaction({ txId })
    },
    async releaseConnection(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) return
      // Edge case: tx was never committed/rolled back explicitly.
      const { txId } = state
      state.txId = null
      await provider.rollbackTransaction({ txId }).catch(() => {})
    },
    async destroy() {},
  } satisfies Driver
}

export const dialects = {
  postgres: memoize((options: DialectOptions) => new Kysely<PostgresDatabase>({ dialect: postgresDialect(options) })),
  mysql: memoize((options: DialectOptions) => new Kysely<MysqlDatabase>({ dialect: mysqlDialect(options) })),
  clickhouse: memoize((options: DialectOptions) => new Kysely<ClickhouseDatabase>({ dialect: clickhouseDialect(options) })),
  mssql: memoize((options: DialectOptions) => new Kysely<MssqlDatabase>({ dialect: mssqlDialect(options) })),
} satisfies Record<ConnectionType, AnyFunction>

export const coldDialects = {
  postgres: memoize(() => new Kysely({ dialect: postgresColdDialect() })),
  mysql: memoize(() => new Kysely({ dialect: mysqlColdDialect() })),
  clickhouse: memoize(() => new Kysely({ dialect: clickhouseColdDialect() })),
  mssql: memoize(() => new Kysely({ dialect: mssqlColdDialect() })),
} satisfies Record<ConnectionType, AnyFunction>
