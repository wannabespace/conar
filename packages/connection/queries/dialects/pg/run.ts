import { once } from 'node:events'

import type { Pool, PoolClient, QueryArrayConfig, QueryResult } from 'pg'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { pg } from './client'

const backendPids = new WeakMap<PoolClient, number>()

const backendPid = async (client: PoolClient) => {
  const cached = backendPids.get(client)
  if (cached !== undefined) {
    return cached
  }
  const { rows } = await client.query<{ pid: number }>(
    'SELECT pg_backend_pid() AS pid'
  )
  const pid = rows[0]?.pid
  if (pid !== undefined) {
    backendPids.set(client, pid)
  }
  return pid
}

export const runOn = async (
  client: PoolClient,
  {
    connectionString,
    pool,
    sql,
    values,
  }: {
    connectionString: string
    pool: Pool
    sql: string
    values: unknown[]
  },
  { maxRows, queryId }: RunOptions
) => {
  const limit = maxRows ?? Infinity
  const pid = queryId ? await backendPid(client) : undefined
  // The pool holds one connection and it is busy, so `pg_cancel_backend` needs its own.
  const cancel = async () => {
    if (pid === undefined) {
      return
    }
    const canceller = new pg.Client(pool.options)
    await canceller.connect()
    try {
      await canceller.query('SELECT pg_cancel_backend($1)', [pid])
    } finally {
      await canceller.end()
    }
  }

  const start = performance.now()
  const rowsOf = new Map<unknown, unknown[][]>()
  const config: QueryArrayConfig = { rowMode: 'array', text: sql, values }
  const [results = []]: (QueryResult | QueryResult[])[] = await cancellable(
    { cancel, connectionString, queryId },
    () =>
      once(
        client
          .query(new pg.Query(config))
          .on('row', (row: unknown[], result) => {
            const rows = rowsOf.get(result) ?? []
            rowsOf.set(result, rows)
            if (rows.length <= limit) {
              rows.push(row)
            }
          }),
        'end'
      )
  )
  return {
    duration: performance.now() - start,
    // A text holding several statements answers with one result each.
    result: [results].flat().map((item) =>
      resultSet(
        {
          affectedRows: item.fields.length === 0 ? item.rowCount : null,
          columns: item.fields.map((field) => field.name),
          rows: rowsOf.get(item) ?? [],
        },
        maxRows
      )
    ),
  }
}
