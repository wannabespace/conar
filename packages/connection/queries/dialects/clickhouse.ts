import type { AnyFunction } from '@conar/memoize'
import type { QueryExecutor } from '..'
import { createRequire } from 'node:module'
import { memoize } from '@conar/memoize'
import { tryParseJson, wrapAggregateError } from '@conar/shared/utils/helpers'
import { parseConnectionString } from '../..'
import { parseSshConfig } from '../../ssh'
import { disposeTransaction, getTransaction, registerTransaction } from '../transactions'
import { ensureTunnel } from './ssh-tunnel'

const clickhouse = createRequire(import.meta.url)('@clickhouse/client') as typeof import('@clickhouse/client')

const CLICKHOUSES_PROTOCOL_RE = /^clickhouses/
const CLICKHOUSE_PROTOCOL_RE = /^clickhouse:/

export const getClient = memoize(async (connectionString: string) => {
  const { searchParams, host, port } = parseConnectionString(connectionString)
  const ssh = parseSshConfig(searchParams)

  let url = connectionString
    .replace(CLICKHOUSES_PROTOCOL_RE, 'https')
    .replace(CLICKHOUSE_PROTOCOL_RE, 'http:')

  if (ssh) {
    const targetPort = port ?? (url.startsWith('https') ? 8443 : 8123)
    const endpoint = await ensureTunnel(ssh, host, targetPort)
    const u = new URL(url)
    u.hostname = endpoint.host
    u.port = String(endpoint.port)
    url = u.toString()
  }

  return clickhouse.createClient({
    url,
    clickhouse_settings: {
      date_time_output_format: 'iso',
    },
  })
})

export function wrapClickhouseError<T extends AnyFunction>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await wrapAggregateError(fn(...args))
    }
    catch (error) {
      if (error instanceof Error) {
        const parsed = tryParseJson<Partial<{ message: string, status: string, code: number, request_id: string }>>(error.message)
        if (parsed?.message)
          throw new Error(parsed.message, { cause: error })
      }
      throw error
    }
  }) as T
}

function isSelectLikeQuery(query: string) {
  return [
    'SELECT',
    'SHOW',
    'DESCRIBE',
    'EXPLAIN',
    'WITH',
    'CHECK',
  ].some(keyword => query.trim().toUpperCase().startsWith(keyword))
}

export const query = {
  execute: wrapClickhouseError(async ({ connectionString, query }) => {
    const client = await getClient(connectionString)

    if (isSelectLikeQuery(query)) {
      const start = performance.now()
      const result = await client.query({ query, format: 'JSONEachRow' }).then(result => result.json())
      return { result, duration: performance.now() - start }
    }

    const start = performance.now()
    await client.exec({ query })

    return { result: [], duration: performance.now() - start }
  }),

  beginTransaction: async ({ connectionString }: { connectionString: string }) => {
    // ClickHouse does not support transactions
    await getClient(connectionString)

    const txId = registerTransaction({
      execute: (q, values) => query.execute({ connectionString, query: q, values }),
      commit: async () => {},
      rollback: async () => {},
      release: async () => {},
    })

    return { txId }
  },

  executeTransaction: async ({ txId, query, values }: { txId: string, query: string, values: unknown[] }) => {
    const handle = getTransaction(txId)
    if (!handle)
      throw new Error(`No active transaction found for id: ${txId}`)

    return handle.execute(query, values)
  },

  commitTransaction: async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle)
      return

    try {
      await handle.commit()
    }
    finally {
      await handle.release().catch(() => {})
    }
  },

  rollbackTransaction: async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle)
      return

    try {
      await handle.rollback()
    }
    finally {
      await handle.release().catch(() => {})
    }
  },
} satisfies QueryExecutor
