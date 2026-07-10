import type { DialectSeedConfig } from '../index'
import type { Column } from '~/entities/connection/components'
import { format, isValid, parseISO } from 'date-fns'
import { mysqlAutoDetect } from './detect'
import { MYSQL_GENERATORS } from './generators'

const DATE_FORMATS: Record<string, string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  timestamp: 'yyyy-MM-dd HH:mm:ss',
}

function mysqlTransformArray(items: unknown[]): unknown {
  return items.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)).join(',')
}

function formatMysqlDate(value: string, type: string): string | null {
  const pattern = DATE_FORMATS[type]
  if (!pattern)
    return null

  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

function mysqlTransformValue(value: unknown, column: Column): unknown {
  const type = column.type?.toLowerCase() ?? ''

  if (type === 'json' && typeof value === 'object' && value !== null)
    return JSON.stringify(value)

  if (typeof value !== 'string')
    return value

  const formatted = formatMysqlDate(value, type)
  if (formatted !== null)
    return formatted

  return value
}

export const mysqlSeedConfig = {
  generators: MYSQL_GENERATORS,
  autoDetect: mysqlAutoDetect,
  transformArray: mysqlTransformArray,
  transformValue: mysqlTransformValue,
} satisfies DialectSeedConfig
