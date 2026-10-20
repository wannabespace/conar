import type { DuckDBResultReader, DuckDBValue } from '@duckdb/node-api'
import { blobValue, DuckDBTypeId } from '@duckdb/node-api'
import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects } from '@tamery/sql'

import type { QueryExecuteResult, ResultSet, RunOptions } from '../..'
import { resultSet } from '../..'
import type { TxHandle } from '../../transactions'

export const DUCKDB = dialects[Dialect.DuckDB]

export type RunStatements = (
  sql: string,
  values: DuckDBValue[],
  options: RunOptions
) => Promise<Omit<ResultSet, 'truncated'>[]>

export type DuckdbTransaction = Pick<
  TxHandle,
  'commit' | 'release' | 'rollback' | 'status'
> & { run: RunStatements }

/** How a file or a Quack server runs statements; everything else about DuckDB is shared. */
export interface DuckdbTransport {
  run: (
    connectionString: string,
    ...args: Parameters<RunStatements>
  ) => ReturnType<RunStatements>
  transaction: (
    connectionString: string,
    readOnly: boolean
  ) => Promise<DuckdbTransaction>
  /** Only a transport that holds a connection between requests has one. */
  openSession?: (connectionString: string) => Promise<DuckdbTransaction>
}

const toInput = (value: unknown): DuckDBValue => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value instanceof Uint8Array) {
    return blobValue(value)
  }
  // The rest arrive as JSON from the client, which the binder takes as they are.
  return (value ?? null) as DuckDBValue
}

const BIG_INTEGERS = new Set([
  DuckDBTypeId.BIGINT,
  DuckDBTypeId.HUGEINT,
  DuckDBTypeId.UBIGINT,
  DuckDBTypeId.UHUGEINT,
])

/** Read as JSON, which keeps a 64-bit integer as text; a safe one goes back to a number, as catalog reads expect. */
export const readRows = (reader: DuckDBResultReader, maxRows: number) => {
  const bigIntegers = new Set(
    reader
      .columnTypes()
      .flatMap((type, index) => (BIG_INTEGERS.has(type.typeId) ? [index] : []))
  )
  return {
    affectedRows: null,
    columns: reader.columnNames(),
    rows: reader
      .getRowsJson()
      .slice(0, maxRows + 1)
      .map((row) =>
        row.map((value, index) =>
          bigIntegers.has(index) &&
          typeof value === 'string' &&
          Number.isSafeInteger(Number(value))
            ? Number(value)
            : value
        )
      ),
  }
}

export const runTimed = async (
  run: RunStatements,
  sql: string,
  values: unknown[],
  options: RunOptions
): Promise<QueryExecuteResult> => {
  const { maxRows = Infinity } = options
  const start = performance.now()
  const results = await run(sql, values.map(toInput), { ...options, maxRows })
  return {
    duration: performance.now() - start,
    result: results.map((result) => resultSet(result, maxRows)),
  }
}
