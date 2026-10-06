import type { PoolOptions } from 'mysql2'
import type * as mysql2Promise from 'mysql2/promise'

import type { RunOptions } from '../..'
import { bindable, resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { killQuery } from './cancel'

const affectedRowsOf = (header: unknown) =>
  typeof header === 'object' &&
  header !== null &&
  'affectedRows' in header &&
  typeof header.affectedRows === 'number'
    ? header.affectedRows
    : null

const setOf = (rows: unknown, fields: unknown, maxRows?: number) =>
  resultSet(
    Array.isArray(rows) && Array.isArray(fields)
      ? {
          affectedRows: null,
          columns: fields.map((field: mysql2Promise.FieldPacket) => field.name),
          rows,
        }
      : { affectedRows: affectedRowsOf(rows), columns: [], rows: [] },
    maxRows
  )

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
  const start = performance.now()
  const [rows, fields] = await cancellable(
    {
      cancel: () => killQuery(conf, connection.threadId),
      connectionString,
      queryId,
    },
    () => connection.query({ rowsAsArray: true, sql }, bindable(values))
  )
  const fieldSets: unknown[] = fields ?? []
  // `CALL` answers with one row set per SELECT inside the procedure, then a status header.
  const sets =
    Array.isArray(rows) && Array.isArray(fieldSets[0])
      ? rows.map((item, index) => setOf(item, fieldSets[index], maxRows))
      : [setOf(rows, fields, maxRows)]
  return { duration: performance.now() - start, result: sets }
}
