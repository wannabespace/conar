import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'
import type * as OracleDb from 'oracledb'

import type { ResultSet, RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { oracledb } from './client'

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

// node-oracledb builds a DATE or TIMESTAMP from its wall-clock fields in the local zone, so the local getters give them back.
const wallClockText = (date: Date, fraction: boolean) => {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${day} ${time}${fraction ? `.${pad(date.getMilliseconds(), 3)}` : ''}`
}

const instantText = (date: Date) =>
  `${date.toISOString().replace('T', ' ').slice(0, -1)} +00:00`

const intervalText = (value: OracleDb.IntervalDS | OracleDb.IntervalYM) => {
  if (value instanceof oracledb.IntervalYM) {
    return `${value.years}-${value.months}`
  }
  const { days = 0, fseconds = 0, hours = 0, minutes = 0, seconds = 0 } = value
  const fraction = fseconds ? `.${pad(fseconds, 9).replace(/0+$/u, '')}` : ''
  return `${days} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}${fraction}`
}

/** The NUMBER's own digits, as a JS number only when that loses none of them. */
const numberValue = (text: unknown) =>
  typeof text === 'string' && String(Number(text)) === text
    ? Number(text)
    : text

const DATE_TYPES = new Map<unknown, (date: Date) => string>([
  [oracledb.DB_TYPE_DATE, (date) => wallClockText(date, false)],
  [oracledb.DB_TYPE_TIMESTAMP, (date) => wallClockText(date, true)],
  [oracledb.DB_TYPE_TIMESTAMP_TZ, instantText],
  [oracledb.DB_TYPE_TIMESTAMP_LTZ, instantText],
])

const fetchTypeHandler = (
  metadata: OracleDb.Metadata<unknown>
): OracleDb.FetchTypeResponse | undefined => {
  const { dbType } = metadata
  const dateText = DATE_TYPES.get(dbType)
  if (dateText) {
    return {
      converter: (value) => (value instanceof Date ? dateText(value) : value),
    }
  }
  if (
    dbType === oracledb.DB_TYPE_NUMBER ||
    dbType === oracledb.DB_TYPE_BINARY_DOUBLE ||
    dbType === oracledb.DB_TYPE_BINARY_FLOAT
  ) {
    return { converter: numberValue, type: oracledb.STRING }
  }
  if (dbType === oracledb.DB_TYPE_CLOB || dbType === oracledb.DB_TYPE_NCLOB) {
    return { type: oracledb.STRING }
  }
  if (dbType === oracledb.DB_TYPE_BLOB) {
    return { type: oracledb.BUFFER }
  }
  if (
    dbType === oracledb.DB_TYPE_INTERVAL_DS ||
    dbType === oracledb.DB_TYPE_INTERVAL_YM
  ) {
    return {
      converter: (value) =>
        value instanceof oracledb.IntervalDS ||
        value instanceof oracledb.IntervalYM
          ? intervalText(value)
          : value,
    }
  }
}

// Oracle SQL has no boolean before 23ai, and node-oracledb binds a plain `Uint8Array` as text.
const bindable = (value: unknown) => {
  if (typeof value === 'boolean') {
    return Number(value)
  }
  if (typeof value === 'bigint') {
    return String(value)
  }
  if (value instanceof Uint8Array && !Buffer.isBuffer(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength)
  }
  return value ?? null
}

/** Oracle runs one statement per call, so a text without bound values is split first; a PL/SQL unit keeps its own semicolons. */
const statementTexts = (sql: string, values: unknown[]) =>
  values.length > 0
    ? [sql]
    : splitStatements(sql, dialects[Dialect.Oracle], {
        groupTransactions: false,
      }).map((statement) => statement.text)

const runStatement = async (
  connection: OracleDb.Connection,
  text: string,
  values: unknown[],
  { autoCommit, maxRows }: { autoCommit: boolean; maxRows: number }
): Promise<Omit<ResultSet, 'truncated'>> => {
  const result = await connection.execute<unknown[]>(
    text,
    values.map(bindable),
    {
      autoCommit,
      fetchTypeHandler,
      // One row past the cap tells the set was truncated; 0 reads them all.
      maxRows: Number.isFinite(maxRows) ? maxRows + 1 : 0,
      outFormat: oracledb.OUT_FORMAT_ARRAY,
    }
  )
  if (result.rows) {
    return {
      affectedRows: null,
      columns: result.metaData?.map((column) => column.name) ?? [],
      rows: result.rows,
    }
  }
  return { affectedRows: result.rowsAffected ?? null, columns: [], rows: [] }
}

export const runOn = async (
  connection: OracleDb.Connection,
  {
    autoCommit,
    connectionString,
    sql,
    values,
  }: {
    autoCommit: boolean
    connectionString: string
    sql: string
    values: unknown[]
  },
  { maxRows = Infinity, queryId }: RunOptions
) => {
  const start = performance.now()
  const sets: Omit<ResultSet, 'truncated'>[] = []
  await cancellable(
    { cancel: () => connection.break(), connectionString, queryId },
    async () => {
      for (const text of statementTexts(sql, values)) {
        sets.push(
          // oxlint-disable-next-line no-await-in-loop -- a script's statements run in order on one connection
          await runStatement(connection, text, values, { autoCommit, maxRows })
        )
      }
    }
  )
  return {
    duration: performance.now() - start,
    result: sets.map((set) => resultSet(set, maxRows)),
  }
}
