import type * as OracleDb from 'oracledb'

import { oracledb } from './client'

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

// node-oracledb builds a DATE or TIMESTAMP from its wall-clock fields in the local zone, so the local getters give them back.
const wallClockText = (date: Date, fraction: boolean) => {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${day} ${time}${fraction ? `.${pad(date.getMilliseconds(), 3)}` : ''}`
}

const utcText = (date: Date) =>
  date.toISOString().replace('T', ' ').slice(0, -1)

const readDate = (
  dateText: (date: Date) => string
): OracleDb.FetchTypeResponse => ({
  converter: (value) => (value instanceof Date ? dateText(value) : value),
})

const READ_NUMBER: OracleDb.FetchTypeResponse = {
  // The NUMBER's own digits, as a JS number only when that loses none of them.
  converter: (text) =>
    typeof text === 'string' && String(Number(text)) === text
      ? Number(text)
      : text,
  type: oracledb.STRING,
}

const READ_INTERVAL: OracleDb.FetchTypeResponse = {
  converter: (value) => {
    if (value instanceof oracledb.IntervalYM) {
      return `${value.years}-${value.months}`
    }
    if (!(value instanceof oracledb.IntervalDS)) {
      return value
    }
    const {
      days = 0,
      fseconds = 0,
      hours = 0,
      minutes = 0,
      seconds = 0,
    } = value
    const fraction = fseconds ? `.${pad(fseconds, 9).replace(/0+$/u, '')}` : ''
    return `${days} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}${fraction}`
  },
}

const READS = new Map<unknown, OracleDb.FetchTypeResponse>([
  [oracledb.DB_TYPE_BINARY_DOUBLE, READ_NUMBER],
  [oracledb.DB_TYPE_BINARY_FLOAT, READ_NUMBER],
  [oracledb.DB_TYPE_BLOB, { type: oracledb.BUFFER }],
  [oracledb.DB_TYPE_CLOB, { type: oracledb.STRING }],
  [oracledb.DB_TYPE_DATE, readDate((date) => wallClockText(date, false))],
  [oracledb.DB_TYPE_INTERVAL_DS, READ_INTERVAL],
  [oracledb.DB_TYPE_INTERVAL_YM, READ_INTERVAL],
  [oracledb.DB_TYPE_NCLOB, { type: oracledb.STRING }],
  [oracledb.DB_TYPE_NUMBER, READ_NUMBER],
  [oracledb.DB_TYPE_TIMESTAMP, readDate((date) => wallClockText(date, true))],
  // No offset: Oracle reads a string bound to this type in the session zone, which `client.ts` pins to UTC.
  [oracledb.DB_TYPE_TIMESTAMP_LTZ, readDate(utcText)],
  [
    oracledb.DB_TYPE_TIMESTAMP_TZ,
    readDate((date) => `${utcText(date)} +00:00`),
  ],
])

export const fetchTypeHandler = ({
  dbType,
}: Pick<OracleDb.Metadata<unknown>, 'dbType'>) => READS.get(dbType)

// Oracle SQL has no boolean before 23ai, and node-oracledb binds a plain `Uint8Array` as text.
export const bindable = (value: unknown) => {
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
