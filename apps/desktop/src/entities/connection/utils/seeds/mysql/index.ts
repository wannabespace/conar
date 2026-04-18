import type { DialectSeedConfig } from '../index'
import type { Column } from '~/entities/connection/components'
import { mysqlAutoDetect } from './detect'
import { MYSQL_GENERATORS } from './generators'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function mysqlTransformArray(items: unknown[]): unknown {
  return items.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)).join(',')
}

function mysqlTransformValue(value: unknown, column: Column): unknown {
  const type = column.type?.toLowerCase() ?? ''

  if (type === 'json' && typeof value === 'object' && value !== null)
    return JSON.stringify(value)

  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    if (type === 'date')
      return value.slice(0, 10)
    if (type === 'datetime' || type === 'timestamp')
      return value.slice(0, 19).replace('T', ' ')
  }

  return value
}

export const mysqlSeedConfig = {
  generators: MYSQL_GENERATORS,
  autoDetect: mysqlAutoDetect,
  transformArray: mysqlTransformArray,
  transformValue: mysqlTransformValue,
} satisfies DialectSeedConfig
