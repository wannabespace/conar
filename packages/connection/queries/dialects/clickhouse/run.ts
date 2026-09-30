import { randomUUID } from 'node:crypto'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { killQuery } from './cancel'
import { getClient } from './client'

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
