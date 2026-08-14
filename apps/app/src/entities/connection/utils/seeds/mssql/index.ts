import { format, isValid, parseISO } from 'date-fns'

import type { Column } from '~/entities/connection/components/table/cell'

import type { DialectSeedConfig } from '../index'
import { mssqlAutoDetect } from './detect'
import { MSSQL_GENERATORS } from './generators'

const BINARY_TYPES = new Set(['binary', 'varbinary', 'image'])
const HEX_PREFIX_REGEX = /^0x/iu

const DATE_FORMATS: Record<string, string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  datetime2: 'yyyy-MM-dd HH:mm:ss.SSS',
  datetimeoffset: 'yyyy-MM-dd HH:mm:ss.SSSxxx',
  smalldatetime: 'yyyy-MM-dd HH:mm:ss',
}

const mssqlShouldSkip = (column: Column) => {
  if (column.isIdentity) {
    return true
  }

  const type = column.type?.toLowerCase() ?? ''
  return type === 'rowversion' || type === 'timestamp'
}

const toBit = (value: unknown): 0 | 1 => (value ? 1 : 0)

const toTinyint = (value: unknown): number => {
  const n =
    typeof value === 'number' ? value : Math.trunc(Number(String(value)))
  if (!Number.isFinite(n)) {
    return 0
  }
  return Math.max(0, Math.min(255, Math.trunc(n)))
}

const toTime = (value: string): string => {
  if (value.includes('T')) {
    return value.slice(11, 19)
  }
  return value.length > 8 ? value.slice(0, 8) : value
}

const formatMssqlDate = (value: string, type: string): string | null => {
  const pattern = DATE_FORMATS[type]
  if (!pattern) {
    return null
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

const mssqlTransformValue = (value: unknown, column: Column): unknown => {
  const type = column.type?.toLowerCase() ?? ''

  if (type === 'bit') {
    return toBit(value)
  }

  if (type === 'tinyint') {
    return toTinyint(value)
  }

  if (type === 'json' && typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }

  if (typeof value !== 'string') {
    return value
  }

  const formatted = formatMssqlDate(value, type)
  if (formatted !== null) {
    return formatted
  }

  if (type === 'time') {
    return toTime(value)
  }

  if (BINARY_TYPES.has(type)) {
    return value.replace(HEX_PREFIX_REGEX, '')
  }

  return value
}

export const mssqlSeedConfig = {
  autoDetect: mssqlAutoDetect,
  generators: MSSQL_GENERATORS,
  shouldSkip: mssqlShouldSkip,
  transformValue: mssqlTransformValue,
} satisfies DialectSeedConfig
