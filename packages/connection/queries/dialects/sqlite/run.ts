import type { DatabaseSync, SQLInputValue } from 'node:sqlite'

import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'

import type { RunOptions } from '../..'
import { resultSet } from '../..'

const toInput = (value: unknown) => {
  if (typeof value === 'boolean') {
    return Number(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return (value ?? null) as SQLInputValue
}

const toOutput = (value: unknown) => {
  if (typeof value !== 'bigint') {
    return value
  }
  return Number.isSafeInteger(Number(value)) ? Number(value) : String(value)
}

/** A RETURNING write makes all its changes on the first step, so stopping past `maxRows` leaves nothing half done. */
export const runOn = (
  db: DatabaseSync,
  sql: string,
  values: unknown[],
  { maxRows = Infinity }: RunOptions
) => {
  const start = performance.now()
  const texts =
    values.length > 0
      ? [sql]
      : splitStatements(sql, dialects[Dialect.SQLite], {
          groupTransactions: false,
        }).map((statement) => statement.text)
  const inputs = values.map(toInput)
  const result = texts.map((text) => {
    const statement = db.prepare(text)
    statement.setReadBigInts(true)
    statement.setReturnArrays(true)
    const columns = statement.columns().map((column) => column.name)
    if (columns.length === 0) {
      const { changes } = statement.run(...inputs)
      return resultSet(
        { affectedRows: Number(changes), columns, rows: [] },
        maxRows
      )
    }
    const rows = statement
      .iterate(...inputs)
      .take(maxRows + 1)
      .map((row) => Object.values(row).map(toOutput))
      .toArray()
    return resultSet({ affectedRows: null, columns, rows }, maxRows)
  })
  return { duration: performance.now() - start, result }
}
