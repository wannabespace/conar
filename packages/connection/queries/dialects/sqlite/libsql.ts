import type {
  Client,
  InStatement,
  InValue,
  ResultSet as LibsqlResultSet,
  Transaction,
} from '@libsql/client/http'
import { createClient } from '@libsql/client/http'

import type { RunOptions } from '../..'
import { handleQueryError, resultSet } from '../..'
import { readConnectionString } from '../../../parse-connection-string'
import { registerTransaction } from '../../transactions'
import type { LocationQueries } from './location'
import { NO_OPEN_SESSION } from './location'
import { statementTexts, toOutput } from './run'

/** `tls=0` reaches a self-hosted libSQL server over plain HTTP; Turso always speaks TLS. */
const openClient = (connectionString: string) => {
  const { host, password, port, searchParams } =
    readConnectionString(connectionString)
  const protocol = searchParams.get('tls') === '0' ? 'http' : 'https'
  return createClient({
    authToken: password || undefined,
    intMode: 'bigint',
    url: `${protocol}://${host}${port ? `:${port}` : ''}`,
  })
}

const toInput = (value: unknown) => (value ?? null) as InValue

const toRows = (rows: LibsqlResultSet['rows'], width: number) =>
  rows.map((row) =>
    Array.from({ length: width }, (_, index) => {
      const value = row[index]
      return value instanceof ArrayBuffer
        ? new Uint8Array(value)
        : toOutput(value)
    })
  )

const SQLITE_ERROR_PREFIX = /^(?:SQLITE_\w+: )+SQLite error: /u

/** Drops the client's own prefix, so a SQL error reads as it does from a file. */
const executeOn = async (
  target: Client | Transaction,
  statement: InStatement
) => {
  try {
    return await target.execute(statement)
  } catch (error) {
    throw error instanceof Error
      ? new Error(error.message.replace(SQLITE_ERROR_PREFIX, ''), {
          cause: error,
        })
      : error
  }
}

/** The server sends every row; past `maxRows` they are only dropped here. */
const runOn = async (
  target: Client | Transaction,
  sql: string,
  values: unknown[],
  { maxRows = Infinity }: RunOptions
) => {
  const start = performance.now()
  const args = values.map(toInput)
  const result = []
  for (const text of statementTexts(sql, values)) {
    // Sequential by design: each statement sees the one before it.
    // oxlint-disable-next-line no-await-in-loop
    const set = await executeOn(target, { args, sql: text })
    result.push(
      resultSet(
        {
          affectedRows: set.columns.length === 0 ? set.rowsAffected : null,
          columns: set.columns,
          rows: toRows(set.rows, set.columns.length),
        },
        maxRows
      )
    )
  }
  return { duration: performance.now() - start, result }
}

export const libsqlQuery = {
  beginTransaction: handleQueryError(
    async ({ accessMode, connectionString, ownerId }) => {
      const client = openClient(connectionString)
      const tx = await client.transaction(
        accessMode === 'read only' ? 'read' : 'write'
      )
      const txId = registerTransaction(
        {
          commit: () => tx.commit(),
          execute: (sql, values, options) => runOn(tx, sql, values, options),
          release: () => {
            tx.close()
            client.close()
          },
          rollback: () => tx.rollback(),
          status: () => Promise.resolve(tx.closed ? 'ended' : 'open'),
        },
        ownerId
      )
      return { txId }
    }
  ),

  // A request over HTTP cannot be called back once sent.
  cancel: () => Promise.resolve(),

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const client = openClient(connectionString)
      try {
        return await runOn(client, sql, values, options)
      } finally {
        client.close()
      }
    }
  ),

  // A client holds no connection of its own between requests, so a BEGIN typed in a tab could not stay open.
  openSession: () => Promise.reject(new Error(NO_OPEN_SESSION)),
} satisfies LocationQueries
