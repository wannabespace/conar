import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { TypedColumn } from './types'
import { toStringLiteral } from './utils'

// `interval` and `point` contain "int"; word-bounded so only integer types match
const INT_RE = /\bu?(?:big|small|tiny|medium)?int(?:eger|\d+)?\b|serial/iu

const firstMatch = <T extends string>(
  type: string,
  fallback: T,
  rules: [pattern: RegExp, result: T][]
) => rules.find(([pattern]) => pattern.test(type))?.[1] ?? fallback

const tsType = (type: string) =>
  firstMatch(type, 'string', [
    [INT_RE, 'number'],
    [/float|decimal|number|double|numeric/iu, 'number'],
    [/bool|bit/iu, 'boolean'],
    [/date|time/iu, 'Date'],
    [/json/iu, 'unknown'],
  ])

export const tsColumnType = (column: TypedColumn) => {
  if (column.enumName && column.availableValues?.length) {
    const union = column.availableValues.map(toStringLiteral).join(' | ')
    return column.isArray ? `(${union})[]` : union
  }
  return `${tsType(column.type)}${column.isArray ? '[]' : ''}`
}

const ZOD_BY_TS_TYPE: Record<ReturnType<typeof tsType>, string> = {
  Date: 'z.date()',
  boolean: 'z.boolean()',
  number: 'z.number()',
  string: 'z.string()',
  unknown: 'z.json()',
}

export const zodType = (column: TypedColumn) => {
  const type = tsType(column.type)
  if (type === 'string' && column.maxLength && column.maxLength > 0) {
    return `z.string().max(${column.maxLength})`
  }
  if (type === 'number' && INT_RE.test(column.type)) {
    return 'z.int()'
  }
  return ZOD_BY_TS_TYPE[type]
}

export const prismaType = (type: string) =>
  firstMatch(type, 'String', [
    [/decimal|numeric/iu, 'Decimal'],
    [/bool/iu, 'Boolean'],
    [/date|timestamp/iu, 'DateTime'],
    [/json/iu, 'Json'],
    [/bigint|bigserial|\bint8\b/iu, 'BigInt'],
    [INT_RE, 'Int'],
    [/float|double|real/iu, 'Float'],
  ])

const DRIZZLE_TYPES: Record<
  Exclude<ConnectionType, ConnectionType.ClickHouse>,
  [RegExp, string][]
> = {
  mssql: [
    [/datetime2/iu, 'datetime2'],
    [/datetime/iu, 'datetime'],
    [/date/iu, 'date'],
    [/bigint/iu, 'bigint'],
    [INT_RE, 'int'],
    [/bit|bool/iu, 'bit'],
    [/text/iu, 'text'],
    [/nvarchar/iu, 'nvarchar'],
    [/varchar/iu, 'varchar'],
    [/decimal|numeric/iu, 'decimal'],
    [/float|real/iu, 'float'],
  ],
  mysql: [
    [/serial/iu, 'serial'],
    [/tinyint/iu, 'tinyint'],
    [/bigint/iu, 'bigint'],
    [INT_RE, 'int'],
    [/text/iu, 'text'],
    [/varchar/iu, 'varchar'],
    [/bool/iu, 'boolean'],
    [/timestamp/iu, 'timestamp'],
    [/datetime/iu, 'datetime'],
    [/date/iu, 'date'],
    [/decimal|numeric/iu, 'decimal'],
    [/double|float|real/iu, 'double'],
    [/json/iu, 'json'],
  ],
  postgres: [
    [/serial/iu, 'serial'],
    [/bigint|\bint8\b/iu, 'bigint'],
    [/smallint|\bint2\b/iu, 'smallint'],
    [INT_RE, 'integer'],
    [/uuid/iu, 'uuid'],
    [/jsonb/iu, 'jsonb'],
    [/text/iu, 'text'],
    [/varchar|character varying/iu, 'varchar'],
    [/bool/iu, 'boolean'],
    [/timestamp/iu, 'timestamp'],
    [/^time/iu, 'time'],
    [/date/iu, 'date'],
    [/decimal|numeric/iu, 'numeric'],
    [/real|float4/iu, 'real'],
    [/double|float/iu, 'doublePrecision'],
    [/json/iu, 'json'],
  ],
}

export const drizzleType = (
  type: string,
  dialect: Exclude<ConnectionType, ConnectionType.ClickHouse>
) => firstMatch(type, 'text', DRIZZLE_TYPES[dialect])
