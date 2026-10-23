import { Dialect } from '@tamery/shared/enums/connection-type'
import { camelCase } from 'change-case'

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

const BACKSLASH_ESCAPING_DIALECTS = new Set<Dialect>([
  Dialect.ClickHouse,
  Dialect.MySQL,
])

const NUMERIC_BOOLEAN_DIALECTS = new Set<Dialect>([
  Dialect.MSSQL,
  Dialect.Oracle,
])

export const formatValue = (value: unknown, dialect: Dialect) => {
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
  if (typeof value === 'boolean' && NUMERIC_BOOLEAN_DIALECTS.has(dialect)) {
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

export const isSingleColumnConstraint = (
  column: Column,
  columns: Column[],
  constraint: 'primaryKey' | 'unique'
) =>
  !!column[constraint] &&
  columns.filter((c) => c[constraint] === column[constraint]).length === 1

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
