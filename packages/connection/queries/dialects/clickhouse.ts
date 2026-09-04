import { createRequire } from 'node:module'

import type * as ClickHouse from '@clickhouse/client'
import type { AnyFunction } from '@tamery/shared/utils/helpers'
import { silently, tryParseJson } from '@tamery/shared/utils/helpers'
import { memoize } from 'memoza'

import type { QueryExecutor } from '..'
import { handleQueryError } from '..'
import {
  disposeTransaction,
  getTransaction,
  registerTransaction,
} from '../transactions'

const clickhouse = createRequire(import.meta.url)(
  '@clickhouse/client'
) as typeof ClickHouse

const getClient = memoize((connectionString: string) => {
  let url = connectionString
  if (connectionString.startsWith('clickhouses')) {
    url = connectionString.replace('clickhouses', 'https')
  } else if (connectionString.startsWith('clickhouse')) {
    url = connectionString.replace('clickhouse', 'http')
  }
  return clickhouse.createClient({
    clickhouse_settings: {
      date_time_output_format: 'iso',
    },
    url,
  })
})

export const wrapClickhouseError = <T extends AnyFunction>(fn: T): T =>
  (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handleQueryError(fn)(...args)
    } catch (error) {
      if (error instanceof Error) {
        const parsed = tryParseJson<
          Partial<{
            message: string
            status: string
            code: number
            request_id: string
          }>
        >(error.message)
        if (parsed?.message) {
          throw new Error(parsed.message, { cause: error })
        }
      }
      throw error
    }
  }) as T

const isSelectLikeQuery = (queryText: string) =>
  ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH', 'CHECK'].some((keyword) =>
    queryText.trim().toUpperCase().startsWith(keyword)
  )

const emptyAsync = async () => {
  /* empty */
}

export const query = {
  beginTransaction: handleQueryError(
    ({
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    }) => {
      const txId = registerTransaction(
        {
          commit: emptyAsync,
          execute: (q) => query.execute({ connectionString, query: q }),
          release: emptyAsync,
          rollback: emptyAsync,
        },
        ownerId
      )

      return Promise.resolve({ txId })
    }
  ),

  commitTransaction: handleQueryError(async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle) {
      return
    }

    try {
      await handle.commit()
    } finally {
      await silently(() => handle.release())
    }
  }),

  execute: wrapClickhouseError(
    async ({
      connectionString,
      query: queryText,
    }: {
      connectionString: string
      query: string
    }) => {
      const client = getClient(connectionString)

      if (isSelectLikeQuery(queryText)) {
        const start = performance.now()
        const response = await client.query({
          format: 'JSONEachRow',
          query: queryText,
        })
        const rows = await response.json()
        return { duration: performance.now() - start, result: rows }
      }

      const start = performance.now()
      await client.exec({ query: queryText })

      return { duration: performance.now() - start, result: [] }
    }
  ),

  executeTransaction: handleQueryError(
    ({
      txId,
      query: queryText,
      values,
    }: {
      txId: string
      query: string
      values: unknown[]
    }) => {
      const handle = getTransaction(txId)
      if (!handle) {
        throw new Error(`No active transaction found for id: ${txId}`)
      }

      return handle.execute(queryText, values)
    }
  ),

  rollbackTransaction: handleQueryError(async ({ txId }: { txId: string }) => {
    const handle = disposeTransaction(txId)
    if (!handle) {
      return
    }

    try {
      await handle.rollback()
    } finally {
      await silently(() => handle.release())
    }
  }),
} satisfies QueryExecutor
