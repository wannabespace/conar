import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { camelCase } from 'change-case'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

import type { TypedColumn } from './types'

export const hasType = (column: Column): column is TypedColumn => !!column.type

export const isValidIdentifier = (name: string): boolean =>
  /^[a-z_$][\w$]*$/iu.test(name)

export const toStringLiteral = (value: string) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

export const toLiteralKey = (name: string) =>
  isValidIdentifier(name) ? name : toStringLiteral(name)

export const isNowDefault = (value: string) =>
  /^\(*(?:now|current_timestamp|getdate|getutcdate|sysdatetime)(?:\(\))?\)*$/iu.test(
    value
  )

export const isSerialDefault = (value: string | null | undefined) =>
  /^nextval\(/iu.test(value ?? '')

const BACKSLASH_ESCAPING_DIALECTS = new Set<ConnectionType>([
  ConnectionType.ClickHouse,
  ConnectionType.MySQL,
])

export const formatValue = (value: unknown, dialect: ConnectionType) => {
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'string') {
    const text = BACKSLASH_ESCAPING_DIALECTS.has(dialect)
      ? value.replaceAll('\\', '\\\\')
      : value
    return `'${text.replaceAll("'", "''")}'`
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'boolean' && dialect === ConnectionType.MSSQL) {
    return value ? '1' : '0'
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`
  }
  return `'${String(value)}'`
}

const quoteWithBackticks = (name: string) => `\`${name.replaceAll('`', '``')}\``

const QUOTE_IDENTIFIER_MAP: Record<ConnectionType, (name: string) => string> = {
  clickhouse: quoteWithBackticks,
  mssql: (name) => `[${name.replaceAll(']', ']]')}]`,
  mysql: quoteWithBackticks,
  postgres: (name) => `"${name.replaceAll('"', '""')}"`,
}

export const quoteIdentifier = (name: string, dialect: ConnectionType) =>
  QUOTE_IDENTIFIER_MAP[dialect](name)

export const isSingleColumnConstraint = (
  column: Column,
  columns: Column[],
  constraint: 'primaryKey' | 'unique'
) =>
  !!column[constraint] &&
  columns.filter((c) => c[constraint] === column[constraint]).length === 1

export const explicitSchema = (schema: string, dialect: ConnectionType) => {
  const { defaultSchema } = capabilitiesOf(dialect)
  return defaultSchema && schema !== defaultSchema ? schema : null
}

export const claimRelationName = (
  usedNames: Set<string>,
  table: string,
  column: string
) => {
  const name = usedNames.has(camelCase(table))
    ? camelCase(`${table}_${column}`)
    : camelCase(table)
  usedNames.add(name)
  return name
}
