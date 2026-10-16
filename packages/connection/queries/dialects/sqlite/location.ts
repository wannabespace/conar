import type { TxHandle } from '../../transactions'

export type SqliteValue = bigint | number | string | Uint8Array | null

/** `changes` is null for a statement held until its transaction commits. */
export interface StatementResult {
  changes: number | null
  columns: string[]
  rows: unknown[][]
}

/** `maxRows` lets a location stop reading early; the shared result mapping drops the rest. */
export type RunStatements = (
  texts: string[],
  values: SqliteValue[],
  maxRows: number
) => Promise<StatementResult[]>

export type LocationTransaction = Pick<
  TxHandle,
  'commit' | 'release' | 'rollback' | 'status'
> & { run: RunStatements }

export interface SqliteLocationQueries {
  run: (
    connectionString: string,
    ...args: Parameters<RunStatements>
  ) => Promise<StatementResult[]>
  transaction: (
    connectionString: string,
    readOnly: boolean
  ) => Promise<LocationTransaction>
  /** Only a location that holds a connection between requests has one. */
  openSession?: (connectionString: string) => LocationTransaction
}
