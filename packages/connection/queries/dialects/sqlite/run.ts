import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'

import type { QueryExecuteResult, RunOptions } from '../..'
import { resultSet } from '../..'
import type { RunStatements, SqliteValue } from './location'

export const SQLITE = dialects[Dialect.SQLite]

/** The same value is stored the same way wherever the database lives. */
const toInput = (value: unknown): SqliteValue => {
  if (typeof value === 'boolean') {
    return Number(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return (value ?? null) as SqliteValue
}

/** A blob arrives as an `ArrayBuffer` from libSQL and as a number array from D1. */
export const toOutput = (value: unknown) => {
  if (typeof value === 'bigint') {
    return Number.isSafeInteger(Number(value)) ? Number(value) : String(value)
  }
  if (value instanceof ArrayBuffer || Array.isArray(value)) {
    return new Uint8Array(value)
  }
  return value
}

/** A driver prepares only the first statement of a text, so a text without bound values runs one statement at a time. */
export const statementTexts = (sql: string, values: unknown[]) =>
  values.length > 0
    ? [sql]
    : splitStatements(sql, SQLITE, { groupTransactions: false }).map(
        (statement) => statement.text
      )

export const runTimed = async (
  run: RunStatements,
  texts: string[],
  values: unknown[],
  { maxRows = Infinity }: RunOptions
): Promise<QueryExecuteResult> => {
  const start = performance.now()
  const results = await run(texts, values.map(toInput), maxRows)
  return {
    duration: performance.now() - start,
    result: results.map(({ changes, columns, rows }) =>
      resultSet(
        { affectedRows: columns.length === 0 ? changes : null, columns, rows },
        maxRows
      )
    ),
  }
}
