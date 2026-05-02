import type { AnyFunction } from '@conar/memoize'
import type { QueryExecutor } from '..'
import { createRequire } from 'node:module'
import { memoize } from '@conar/memoize'
import { tryParseJson, wrapAggregateError } from '@conar/shared/utils/helpers'
import { disposeTransaction, getTransaction, registerTransaction } from '../transactions'

const clickhouse = createRequire(import.meta.url)('@clickhouse/client') as typeof import('@clickhouse/client')

export const getClient = memoize((connectionString: string) => {
  let url = connectionString
  if (connectionString.startsWith('clickhouses')) {
    url = connectionString.replace('clickhouses', 'https')
  }
  else if (connectionString.startsWith('clickhouse')) {
    url = connectionString.replace('clickhouse', 'http')
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
    const client = getClient(connectionString)

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
