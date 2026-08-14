import { format, isValid, parseISO } from 'date-fns'

import type { Column } from '~/entities/connection/components/table/cell'

import type { DialectSeedConfig } from '../index'
import { mysqlAutoDetect } from './detect'
import { MYSQL_GENERATORS } from './generators'

const DATE_FORMATS: Record<string, string> = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  timestamp: 'yyyy-MM-dd HH:mm:ss',
}

const mysqlTransformArray = (items: unknown[]): unknown =>
  items
    .map((v) =>
      typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)
    )
    .join(',')

const formatMysqlDate = (value: string, type: string): string | null => {
  const pattern = DATE_FORMATS[type]
  if (!pattern) {
    return null
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : null
}

const mysqlTransformValue = (value: unknown, column: Column): unknown => {
  const type = column.type?.toLowerCase() ?? ''

  if (type === 'json' && typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }

  if (typeof value !== 'string') {
    return value
  }

  const formatted = formatMysqlDate(value, type)
  if (formatted !== null) {
    return formatted
  }

  return value
}

export const mysqlSeedConfig = {
  autoDetect: mysqlAutoDetect,
  generators: MYSQL_GENERATORS,
  transformArray: mysqlTransformArray,
  transformValue: mysqlTransformValue,
} satisfies DialectSeedConfig
