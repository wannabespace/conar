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

// mysql2 fills every `?`, so one inside a quoted literal or identifier would take a later placeholder's value.
const placeholderRegex =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`]|``)*`|\?/gu

export const inlineValues = (
  sql: string,
  values: unknown[],
  escape: (value: unknown) => string
) => {
  let index = 0
  return sql.replace(placeholderRegex, (token) => {
    if (token !== '?') {
      return token
    }
    index += 1
    return escape(values[index - 1])
  })
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
    () =>
      connection.query({
        rowsAsArray: true,
        sql:
          values.length > 0
            ? inlineValues(sql, values, (value) => connection.escape(value))
            : sql,
      })
  )
  const fieldSets: unknown[] = fields ?? []
  // `CALL` answers with one row set per SELECT inside the procedure, then a status header.
  const sets =
    Array.isArray(rows) && Array.isArray(fieldSets[0])
      ? rows.map((item, index) => setOf(item, fieldSets[index], maxRows))
      : [setOf(rows, fields, maxRows)]
  return { duration: performance.now() - start, result: sets }
}
