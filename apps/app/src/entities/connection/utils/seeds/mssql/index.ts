import type { DialectSeedConfig } from '../index'
import type { Column } from '~/entities/connection/components'
import { format, isValid, parseISO } from 'date-fns'
import { mssqlAutoDetect } from './detect'
import { MSSQL_GENERATORS } from './generators'

const BINARY_TYPES = new Set(['binary', 'varbinary', 'image'])
const HEX_PREFIX_REGEX = /^0x/i

const DATE_FORMATS: Record<string, string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  datetime2: 'yyyy-MM-dd HH:mm:ss.SSS',
  smalldatetime: 'yyyy-MM-dd HH:mm:ss',
  datetimeoffset: 'yyyy-MM-dd HH:mm:ss.SSSxxx',
}

function mssqlShouldSkip(column: Column) {
  if (column.isIdentity)
    return true

  const type = column.type?.toLowerCase() ?? ''
  return type === 'rowversion' || type === 'timestamp'
}

function toBit(value: unknown): 0 | 1 {
  return value ? 1 : 0
}

function toTinyint(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  if (!Number.isFinite(n))
    return 0
  return Math.max(0, Math.min(255, Math.trunc(n)))
}

function toTime(value: string): string {
  if (value.includes('T'))
    return value.slice(11, 19)
  return value.length > 8 ? value.slice(0, 8) : value
}

function formatMssqlDate(value: string, type: string): string | null {
  const pattern = DATE_FORMATS[type]
  if (!pattern)
    return null

  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

function mssqlTransformValue(value: unknown, column: Column): unknown {
  const type = column.type?.toLowerCase() ?? ''

  if (type === 'bit')
    return toBit(value)

  if (type === 'tinyint')
    return toTinyint(value)

  if (type === 'json' && typeof value === 'object' && value !== null)
    return JSON.stringify(value)

  if (typeof value !== 'string')
    return value

  const formatted = formatMssqlDate(value, type)
  if (formatted !== null)
    return formatted

  if (type === 'time')
    return toTime(value)

  if (BINARY_TYPES.has(type))
    return value.replace(HEX_PREFIX_REGEX, '')

  return value
}

export const mssqlSeedConfig = {
  generators: MSSQL_GENERATORS,
  autoDetect: mssqlAutoDetect,
  shouldSkip: mssqlShouldSkip,
  transformValue: mssqlTransformValue,
} satisfies DialectSeedConfig
