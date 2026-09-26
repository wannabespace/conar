import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'

import type * as ClickHouse from '@clickhouse/client'
import type { AnyFunction } from '@tamery/shared/utils'
import { tryParseJson } from '@tamery/shared/utils'
import { memoize } from 'memoza'

import type { QueryExecutor, RunOptions } from '..'
import { handleQueryError, resultSet } from '..'
import { cancellable, cancellationQueries } from '../cancellation'
import { registerTransaction, transactionQueries } from '../transactions'

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

const wrapClickhouseError = <T extends AnyFunction>(fn: T): T =>
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
  ...transactionQueries,
  ...cancellationQueries,

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
          execute: (q, _values, options) =>
            query.execute({ connectionString, query: q, ...options }),
          release: emptyAsync,
          rollback: emptyAsync,
        },
        ownerId
      )

      return Promise.resolve({ txId })
    }
  ),

  execute: wrapClickhouseError(
    ({
      connectionString,
      query: queryText,
      maxRows,
      queryId,
    }: {
      connectionString: string
      query: string
    } & RunOptions) => {
      const client = getClient(connectionString)
      const controller = new AbortController()
      // ClickHouse keeps running a query whose HTTP request was dropped, so a cancel kills it by id.
      const clickhouseQueryId = randomUUID()
      const start = performance.now()

      return cancellable(
        {
          cancel: async () => {
            try {
              await client.command({
                query: 'KILL QUERY WHERE query_id = {id:String}',
                query_params: { id: clickhouseQueryId },
              })
            } finally {
              controller.abort()
            }
          },
          connectionString,
          queryId,
        },
        async () => {
          if (isSelectLikeQuery(queryText)) {
            const response = await client.query({
              abort_signal: controller.signal,
              // One row past the cap is how `truncated` finds out there were more.
              clickhouse_settings:
                maxRows === undefined
                  ? {}
                  : {
                      max_result_rows: String(maxRows + 1),
                      result_overflow_mode: 'break',
                    },
              format: 'JSONCompact',
              query: queryText,
              query_id: clickhouseQueryId,
            })
            const { data, meta = [] } = await response.json<unknown[]>()
            return {
              duration: performance.now() - start,
              result: [
                resultSet(
                  {
                    affectedRows: null,
                    columns: meta.map((column) => column.name),
                    rows: data,
                  },
                  maxRows
                ),
              ],
            }
          }
          await client.exec({
            abort_signal: controller.signal,
            query: queryText,
            query_id: clickhouseQueryId,
          })
          return {
            duration: performance.now() - start,
            result: [resultSet({ affectedRows: null, columns: [], rows: [] })],
          }
        }
      )
    }
  ),
} satisfies QueryExecutor
