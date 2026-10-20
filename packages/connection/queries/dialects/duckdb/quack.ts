import type { DuckDBValue } from '@duckdb/node-api'
import { DuckDBBlobValue } from '@duckdb/node-api'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { noop } from '@tamery/shared/utils'
import { readsOnly, splitStatements, tokenize } from '@tamery/sql'

import type { RunOptions } from '../..'
import { DEFAULT_PORTS } from '../../../connection-parts'
import { readConnectionString } from '../../../parse-connection-string'
import { cancellable } from '../../cancellation'
import { quackClient } from './client'
import type { DuckdbTransport, RunStatements } from './run'
import { DUCKDB, readRows } from './run'

const POSITIONAL_PARAMETER = /^\$(?<position>\d+)$/u

/** The client points its own error context at the `quack_query` call that carried the statement. */
const CALL_CONTEXT = /\n+LINE \d+: FROM quack_query\(.*$/su

/** A statement that returns no rows answers with a lone `Count` or `Success` column. */
const STATUS_COLUMNS = new Set(['Count', 'Success'])

const literal = (value: DuckDBValue): string => {
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : `'${value}'::DOUBLE`
  }
  if (typeof value === 'bigint') {
    return String(value)
  }
  const text = `'${String(value).replaceAll("'", "''")}'`
  return value instanceof DuckDBBlobValue ? `${text}::BLOB` : text
}

/** `quack_query` takes the statement's text alone, so each bound value is written into it as a literal. */
const inline = (sql: string, values: DuckDBValue[]) => {
  let text = sql
  for (const { end, start, text: token } of tokenize(
    sql,
    DUCKDB
  ).tokens.toReversed()) {
    const position = POSITIONAL_PARAMETER.exec(token)?.groups?.position
    const value = position ? values[Number(position) - 1] : undefined
    if (value !== undefined) {
      text = text.slice(0, start) + literal(value) + text.slice(end)
    }
  }
  return text
}

/** Each request is a session of its own on the server, so a text runs one statement at a time. */
const statementTexts = (sql: string, values: DuckDBValue[]) =>
  values.length > 0
    ? [inline(sql, values)]
    : splitStatements(sql, DUCKDB, { groupTransactions: false }).map(
        (statement) => statement.text
      )

const quackCall = (connectionString: string) => {
  const { host, password, port, searchParams } =
    readConnectionString(connectionString)
  const address = host.includes(':') ? `[${host}]` : host
  const disableSsl = searchParams.get('disable_ssl')
  const settings: [string, boolean | string][] = [
    ...(password ? [['token', password] as [string, string]] : []),
    ...(disableSsl
      ? [['disable_ssl', disableSsl === 'true'] as [string, boolean]]
      : []),
  ]
  return {
    sql: `FROM quack_query(${[
      '$1',
      '$2',
      ...settings.map(([name], index) => `${name} => $${index + 3}`),
    ].join(', ')})`,
    values: (text: string) => [
      `quack:${address}:${port || DEFAULT_PORTS[ConnectionType.DuckDB]}`,
      text,
      ...settings.map(([, value]) => value),
    ],
  }
}

const send = async (
  connectionString: string,
  texts: string[],
  { maxRows = Infinity, queryId }: RunOptions
): ReturnType<RunStatements> => {
  const call = quackCall(connectionString)
  const client = await quackClient()
  const connection = await client.connect()
  try {
    // Interrupting stops the client waiting; the protocol has no way to stop the server.
    return await cancellable(
      {
        cancel: () => Promise.resolve(connection.interrupt()),
        connectionString,
        queryId,
      },
      async () => {
        const results = []
        for (const text of texts) {
          // oxlint-disable-next-line no-await-in-loop -- the statements of a text run in order, each on a server session of its own.
          const reader = await connection.streamAndReadUntil(
            call.sql,
            maxRows + 1,
            call.values(text)
          )
          const result = readRows(reader, maxRows)
          const [column = '', ...others] = result.columns
          results.push(
            others.length === 0 &&
              STATUS_COLUMNS.has(column) &&
              !readsOnly(text, DUCKDB)
              ? {
                  affectedRows: Number(result.rows[0]?.[0] ?? 0),
                  columns: [],
                  rows: [],
                }
              : result
          )
        }
        return results
      }
    )
  } catch (error) {
    throw error instanceof Error
      ? new Error(error.message.replace(CALL_CONTEXT, ''), { cause: error })
      : error
  } finally {
    connection.closeSync()
  }
}

/** The server keeps no transaction between requests, so read only is held by refusing any statement that writes. */
const readOnlyTransaction = (connectionString: string) => ({
  commit: noop,
  release: noop,
  rollback: noop,
  run: ((sql, values, options) => {
    const texts = statementTexts(sql, values)
    return texts.every((text) => readsOnly(text, DUCKDB))
      ? send(connectionString, texts, options)
      : Promise.reject(
          new Error('A read-only transaction runs only statements that read.')
        )
  }) satisfies RunStatements,
})

/** A write transaction collects its statements and sends them as one script on commit, which the server runs atomically. */
const batchedTransaction = (connectionString: string) => {
  let pending: string[] = []
  return {
    commit: async () => {
      if (pending.length > 0) {
        await send(
          connectionString,
          [
            ['BEGIN TRANSACTION', ...pending, 'COMMIT']
              .map((text) => `${text}\n;`)
              .join('\n'),
          ],
          {}
        )
      }
    },
    release: noop,
    rollback: () => {
      pending = []
    },
    run: ((sql, values) => {
      const texts = statementTexts(sql, values)
      pending = [...pending, ...texts]
      return Promise.resolve(
        texts.map(() => ({ affectedRows: null, columns: [], rows: [] }))
      )
    }) satisfies RunStatements,
  }
}

export const quackTransport = {
  run: (connectionString, sql, values, options) =>
    send(connectionString, statementTexts(sql, values), options),

  transaction: (connectionString, readOnly) =>
    Promise.resolve(
      readOnly
        ? readOnlyTransaction(connectionString)
        : batchedTransaction(connectionString)
    ),
} satisfies DuckdbTransport
