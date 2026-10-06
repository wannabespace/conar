import { randomUUID } from 'node:crypto'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { killQuery } from './cancel'
import { getClient } from './client'

const bigIntegerTypeRegex = /^(?:Nullable\()?U?Int(?:64|128|256)\b/u

// Quoted so a value past 2^53 survives `JSON.parse`; a safe one goes back to a number, as catalog reads expect.
const unquoteSafeIntegers = (
  meta: { name: string; type: string }[],
  data: unknown[][]
) => {
  const indexes = meta.flatMap((column, index) =>
    bigIntegerTypeRegex.test(column.type) ? [index] : []
  )
  for (const row of data) {
    for (const index of indexes) {
      const value = row[index]
      if (typeof value === 'string' && Number.isSafeInteger(Number(value))) {
        row[index] = Number(value)
      }
    }
  }
  return data
}

const isSelectLikeQuery = (queryText: string) =>
  ['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH', 'CHECK'].some((keyword) =>
    queryText.trim().toUpperCase().startsWith(keyword)
  )

export const runQuery = ({
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
      cancel: () => killQuery(client, clickhouseQueryId, controller),
      connectionString,
      queryId,
    },
    async () => {
      if (isSelectLikeQuery(queryText)) {
        const response = await client.query({
          abort_signal: controller.signal,
          clickhouse_settings: {
            output_format_json_quote_64bit_integers: 1,
            output_format_json_quote_decimals: 1,
            // One row past the cap is how `truncated` finds out there were more.
            ...(maxRows === undefined
              ? {}
              : {
                  max_result_rows: String(maxRows + 1),
                  result_overflow_mode: 'break',
                }),
          },
          format: 'JSONCompact',
          query: queryText,
          query_id: clickhouseQueryId,
        })
        const { data, meta = [] } = await response.json<unknown[][]>()
        return {
          duration: performance.now() - start,
          result: [
            resultSet(
              {
                affectedRows: null,
                columns: meta.map((column) => column.name),
                rows: unquoteSafeIntegers(meta, data),
              },
              maxRows
            ),
          ],
        }
      }
      await client.command({
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
