import type { Client, Transaction } from '@libsql/client/http'
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

/** On a client, each statement runs on a stream of its own; only a `Transaction` keeps one between them. */
const runOn = (
  target: Client | Transaction,
  texts: string[],
  args: SqliteValue[]
) =>
  // One at a time: each statement sees the one before it.
  Array.fromAsync(texts, async (sql) => {
    const set = await target.execute({ args, sql }).catch((error: unknown) => {
      throw error instanceof Error
        ? new Error(error.message.replace(SQLITE_ERROR_PREFIX, ''), {
            cause: error,
          })
        : error
    })
    return {
      changes: set.rowsAffected,
      columns: set.columns,
      rows: set.rows.map((row) => Array.from(row, toOutput)),
    }
  })

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
