import type { Client, InStatement, Transaction } from '@libsql/client/http'
import { createClient } from '@libsql/client/http'

import { readConnectionString } from '../../../parse-connection-string'
import type { SqliteLocationQueries, SqliteValue } from './location'
import { toOutput } from './run'

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

/** On a client, each statement runs on a stream of its own; only a `Transaction` keeps one between them. */
const runOn = async (
  target: Client | Transaction,
  texts: string[],
  args: SqliteValue[]
) => {
  const results = []
  for (const sql of texts) {
    // Sequential by design: each statement sees the one before it.
    // oxlint-disable-next-line no-await-in-loop
    const set = await executeOn(target, { args, sql })
    results.push({
      changes: set.rowsAffected,
      columns: set.columns,
      rows: set.rows.map((row) =>
        set.columns.map((_, index) => toOutput(row[index]))
      ),
    })
  }
  return results
}

export const libsqlLocation = {
  run: async (connectionString, texts, values) => {
    const client = openClient(connectionString)
    try {
      return await runOn(client, texts, values)
    } finally {
      client.close()
    }
  },

  transaction: async (connectionString, readOnly) => {
    const client = openClient(connectionString)
    const tx = await client
      .transaction(readOnly ? 'read' : 'write')
      .catch((error: unknown) => {
        client.close()
        throw error
      })
    return {
      commit: () => tx.commit(),
      release: () => {
        tx.close()
        client.close()
      },
      rollback: () => tx.rollback(),
      run: (texts, values) => runOn(tx, texts, values),
      status: () => Promise.resolve(tx.closed ? 'ended' : 'open'),
    }
  },
} satisfies SqliteLocationQueries
