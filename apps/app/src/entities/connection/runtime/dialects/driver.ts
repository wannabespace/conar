import { rowObjects } from '@tamery/connection/queries'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { PORTS } from '@tamery/shared/ports'
import { silently } from '@tamery/shared/utils'
import type {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  QueryResult,
  TransactionSettings,
} from 'kysely'

import { getCollections } from '~/entities/collections'
import { createProxyClient, orpcProxy } from '~/lib/orpc'

import { fetchingConfig } from '../../fetching-config'
import { getConnectionStore } from '../../store/stores'

export interface DialectOptions {
  connectionString: string
  connectionId?: string
  resourceId?: string
  resultSets?: { maxRows: number }
  log?: (params: {
    promise: Promise<{
      result: unknown
      duration: number
    }>
    query: string
    values?: unknown[]
  }) => void
}

const resolveProxyIdParams = (options: DialectOptions) => {
  if (options.resourceId) {
    return { resourceId: options.resourceId }
  }
  if (options.connectionId) {
    return { connectionId: options.connectionId }
  }
  return { connectionString: options.connectionString }
}

interface QueryPayload {
  query: string
  values: unknown[]
  queryId?: string
}

interface TxQueryPayload extends QueryPayload {
  txId: string
}

export const createDialectProvider = (
  type: ConnectionType,
  options: DialectOptions
) => {
  const { connectionsCollection, connectionsResourcesCollection } =
    getCollections()
  const resource = options.resourceId
    ? connectionsResourcesCollection.get(options.resourceId)
    : null
  const connectionId = options.connectionId || resource?.connectionId
  const connection = connectionId
    ? connectionsCollection.get(connectionId)
    : null

  const maxRows = options.resultSets?.maxRows
  const resolveTransport = () => {
    const proxy = connectionId
      ? getConnectionStore(connectionId).get().proxy
      : { enabled: false, url: null }
    const config = connection ? fetchingConfig(connection, { proxy }) : null

    if (config?.type === 'proxy') {
      const client = createProxyClient(
        proxy.url || `http://localhost:${PORTS.LOCAL_PROXY}`
      )
      return { kind: 'proxy' as const, proxy: client[type] }
    }

    const electron = window.electron?.query[type]
    if (electron) {
      return { electron, kind: 'electron' as const }
    }

    return { kind: 'cloud-proxy' as const, proxy: orpcProxy.query[type] }
  }

  return {
    beginTransaction(settings: TransactionSettings) {
      const t = resolveTransport()
      if (t.kind === 'electron') {
        return t.electron.beginTransaction({
          connectionString: options.connectionString,
          ...settings,
        })
      }
      return t.proxy.beginTransaction({
        ...resolveProxyIdParams(options),
        ...settings,
      })
    },
    cancel(queryId: string) {
      const t = resolveTransport()
      if (t.kind === 'electron') {
        return t.electron.cancel({
          connectionString: options.connectionString,
          queryId,
        })
      }
      return t.proxy.cancel({ ...resolveProxyIdParams(options), queryId })
    },
    commitTransaction(params: { txId: string }) {
      const t = resolveTransport()
      return t.kind === 'electron'
        ? t.electron.commitTransaction(params)
        : t.proxy.commitTransaction(params)
    },
    execute(payload: QueryPayload) {
      const t = resolveTransport()
      return t.kind === 'electron'
        ? t.electron.execute({
            connectionString: options.connectionString,
            ...payload,
            maxRows,
          })
        : t.proxy.execute({
            ...resolveProxyIdParams(options),
            ...payload,
            maxRows,
          })
    },
    executeTransaction(params: TxQueryPayload) {
      const t = resolveTransport()
      const payload = { ...params, maxRows }
      return t.kind === 'electron'
        ? t.electron.executeTransaction(payload)
        : t.proxy.executeTransaction(payload)
    },
    rollbackTransaction(params: { txId: string }) {
      const t = resolveTransport()
      return t.kind === 'electron'
        ? t.electron.rollbackTransaction(params)
        : t.proxy.rollbackTransaction(params)
    },
  }
}

export const createKyselyDriver = (
  type: ConnectionType,
  options: DialectOptions,
  transformQuery = (compiledQuery: CompiledQuery): QueryPayload => ({
    query: compiledQuery.sql,
    values: compiledQuery.parameters as unknown[],
  })
) => {
  const provider = createDialectProvider(type, options)
  const txStates = new WeakMap<DatabaseConnection, { txId: string | null }>()

  const executeAndLog = (compiledQuery: CompiledQuery, txId: string | null) => {
    const payload = {
      ...transformQuery(compiledQuery),
      queryId: compiledQuery.queryId.queryId,
    }
    const promise = (
      txId
        ? provider.executeTransaction({ txId, ...payload })
        : provider.execute(payload)
    ).then(({ duration, result }) => ({
      duration,
      result: options.resultSets ? result : rowObjects(result),
    }))
    options.log?.({
      promise,
      query: compiledQuery.sql,
      values: compiledQuery.parameters as unknown[],
    })
    return promise
  }

  return {
    acquireConnection() {
      const state: { txId: string | null } = { txId: null }
      const connection: DatabaseConnection = {
        executeQuery: async <R>(
          compiledQuery: CompiledQuery
        ): Promise<QueryResult<R>> => {
          const { result } = await executeAndLog(compiledQuery, state.txId)
          return { rows: result as R[] }
        },
        streamQuery() {
          throw new Error('Not implemented')
        },
      }
      txStates.set(connection, state)
      return Promise.resolve(connection)
    },
    async beginTransaction(connection, settings) {
      const state = txStates.get(connection)
      if (!state) {
        throw new Error('Transaction state missing for acquired connection')
      }

      const { txId } = await provider.beginTransaction(settings)
      state.txId = txId
    },
    async commitTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) {
        return
      }
      await provider.commitTransaction({ txId: state.txId })
      state.txId = null
    },
    destroy() {
      return Promise.resolve()
    },
    init() {
      return Promise.resolve()
    },
    async releaseConnection(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) {
        return
      }
      const { txId } = state
      state.txId = null
      await silently(() => provider.rollbackTransaction({ txId }))
    },
    async rollbackTransaction(connection) {
      const state = txStates.get(connection)
      if (!state?.txId) {
        return
      }
      const { txId } = state
      state.txId = null
      await provider.rollbackTransaction({ txId })
    },
  } satisfies Driver
}
