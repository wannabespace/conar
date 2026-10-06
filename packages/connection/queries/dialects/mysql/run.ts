import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { mysql2 } from './client'

const setOf = (rows: unknown, fields: unknown, maxRows?: number) => {
  if (Array.isArray(rows) && Array.isArray(fields)) {
    return resultSet(
      {
        affectedRows: null,
        columns: fields.map((field: mysql2Promise.FieldPacket) => field.name),
        rows,
      },
      maxRows
    )
  }
  const affectedRows =
    typeof rows === 'object' &&
    rows !== null &&
    'affectedRows' in rows &&
    typeof rows.affectedRows === 'number'
      ? rows.affectedRows
      : null
  return resultSet({ affectedRows, columns: [], rows: [] }, maxRows)
}

export const runOn = async (
  connection: mysql2Promise.PoolConnection,
  {
    conf,
    connectionString,
    sql,
    values,
  }: {
    conf: PoolOptions
    connectionString: string
    sql: string
    values: unknown[]
  },
  { maxRows, queryId }: RunOptions
) => {
  // The pool holds one connection and it is busy, so `KILL QUERY` needs its own.
  const cancel = async () => {
    const killer = await mysql2.createConnection(conf)
    try {
      await killer.query('KILL QUERY ?', [connection.threadId])
    } finally {
      await killer.end()
    }
  }

  const start = performance.now()
  const [rows, fields] = await cancellable(
    { cancel, connectionString, queryId },
    () => connection.query({ rowsAsArray: true, sql }, values)
  )
  const fieldSets: unknown[] = fields ?? []
  // `CALL` answers with one row set per SELECT inside the procedure, then a status header.
  const sets =
    Array.isArray(rows) && Array.isArray(fieldSets[0])
      ? rows.map((item, index) => setOf(item, fieldSets[index], maxRows))
      : [setOf(rows, fields, maxRows)]
  return { duration: performance.now() - start, result: sets }
}
