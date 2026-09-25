import type { AnyFunction } from '@tamery/shared/utils'
import { handleAggregateError, uppercaseFirst } from '@tamery/shared/utils'

export interface QueryExecuteResult {
  result: ResultSet[]
  duration: number
}

export interface ResultSet {
  columns: string[]
  rows: unknown[][]
  /** Rows a write changed; `null` for a statement that returned rows. */
  affectedRows: number | null
  truncated: boolean
}

export interface RunOptions {
  /** Registers the run so `cancel` can stop it on the server. */
  queryId?: string
  maxRows?: number
}

// ponytail: rows are fetched whole and cut here; stream through a cursor if proxy memory matters.
export const resultSet = (
  { affectedRows, columns, rows }: Omit<ResultSet, 'truncated'>,
  maxRows = Infinity
): ResultSet => ({
  affectedRows,
  columns,
  rows: rows.slice(0, maxRows),
  truncated: rows.length > maxRows,
})

/** The first set as row objects; a duplicate column name keeps its last value. */
export const rowObjects = ([first]: ResultSet[]) =>
  first
    ? first.rows.map((row) =>
        Object.fromEntries(first.columns.map((column, i) => [column, row[i]]))
      )
    : []

export interface QueryExecutor {
  execute: (
    args: {
      connectionString: string
      query: string
      values?: unknown[]
    } & RunOptions
  ) => Promise<QueryExecuteResult>
  beginTransaction: (args: {
    connectionString: string
    ownerId?: string
  }) => Promise<{ txId: string }>
  executeTransaction: (
    args: {
      txId: string
      query: string
      values: unknown[]
      ownerId?: string
    } & RunOptions
  ) => Promise<QueryExecuteResult>
  commitTransaction: (args: { txId: string; ownerId?: string }) => Promise<void>
  rollbackTransaction: (args: {
    txId: string
    ownerId?: string
  }) => Promise<void>
  /** Stops a running query on the database; a no-op once it finished. */
  cancel: (args: { connectionString: string; queryId: string }) => Promise<void>
}

export const replaceErrorPrefix = (message: string) =>
  message.toLowerCase().startsWith('error: ') ? message.slice(7) : message

export const handleQueryError = <T extends AnyFunction>(fn: T): T =>
  (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await handleAggregateError(fn)(...args)
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error
      }

      throw new Error(uppercaseFirst(replaceErrorPrefix(error.message)), {
        cause: error,
      })
    }
  }) as T
