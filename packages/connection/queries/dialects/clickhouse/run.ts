import { randomUUID } from 'node:crypto'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { getClient } from './client'

// `client.query` appends a FORMAT clause, which only a statement that returns rows accepts.
const ROW_RETURNING_COMMANDS = new Set([
  'CHECK',
  'DESC',
  'DESCRIBE',
  'EXISTS',
  'EXPLAIN',
  'SELECT',
  'SHOW',
  'WITH',
])
// Leading comments and parentheses skipped. Each comment matches exactly one way, or a text without a word backtracks exponentially.
const FIRST_WORD =
  /^(?:\s|\(|(?:--|#)[^\n]*(?:\n|$)|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?<command>\w+)/u

const bigIntegerType = /^(?:Nullable\()?U?Int(?:64|128|256)\b/u

// Quoted so a value past 2^53 survives `JSON.parse`; a safe one goes back to a number, as catalog reads expect.
const unquoteSafeIntegers = (meta: { type: string }[], data: unknown[][]) => {
  const indexes = meta.flatMap((column, index) =>
    bigIntegerType.test(column.type) ? [index] : []
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

export const runQuery = ({
  connectionString,
  maxRows = Infinity,
  query: sql,
  queryId,
  readOnly,
}: {
  connectionString: string
  query: string
  readOnly?: boolean
} & RunOptions) => {
  const client = getClient(connectionString)
  const controller = new AbortController()
  // ClickHouse keeps running a query whose HTTP request was dropped, so a cancel kills it by id.
  const clickhouseQueryId = randomUUID()
  const start = performance.now()

  const cancel = async () => {
    try {
      await client.command({
        query: 'KILL QUERY WHERE query_id = {id:String}',
        query_params: { id: clickhouseQueryId },
      })
    } finally {
      controller.abort()
    }
  }

  return cancellable({ cancel, connectionString, queryId }, async () => {
    const command = FIRST_WORD.exec(sql)?.groups?.command?.toUpperCase() ?? ''
    if (!ROW_RETURNING_COMMANDS.has(command)) {
      await client.command({
        abort_signal: controller.signal,
        // 2, not 1: 1 also forbids the output settings every query passes.
        ...(readOnly && { clickhouse_settings: { readonly: '2' } }),
        query: sql,
        query_id: clickhouseQueryId,
      })
      return {
        duration: performance.now() - start,
        result: [
          resultSet({ affectedRows: null, columns: [], rows: [] }, maxRows),
        ],
      }
    }

    const response = await client.query({
      abort_signal: controller.signal,
      clickhouse_settings: {
        output_format_json_quote_64bit_integers: 1,
        output_format_json_quote_decimals: 1,
        ...(readOnly && { readonly: '2' }),
        // One row past the cap is how `truncated` finds out there were more.
        ...(Number.isFinite(maxRows) && {
          max_result_rows: String(maxRows + 1),
          result_overflow_mode: 'break',
        }),
      },
      format: 'JSONCompactEachRowWithNamesAndTypes',
      query: sql,
      query_id: clickhouseQueryId,
    })
    // `break` overflows to the end of a block, so the read itself stops at the cap. The first two rows are the names and types.
    const header: unknown[][] = []
    const rows: unknown[][] = []
    for await (const batch of response.stream()) {
      for (const row of batch) {
        if (header.length < 2) {
          header.push(row.json())
        } else if (rows.length <= maxRows) {
          rows.push(row.json())
        }
      }
      if (rows.length > maxRows) {
        break
      }
    }
    const [names = [], types = []] = header
    const meta = names.map((name, index) => ({
      name: String(name),
      type: String(types[index]),
    }))
    return {
      duration: performance.now() - start,
      result: [
        resultSet(
          {
            affectedRows: null,
            columns: meta.map((column) => column.name),
            rows: unquoteSafeIntegers(meta, rows),
          },
          maxRows
        ),
      ],
    }
  })
}
