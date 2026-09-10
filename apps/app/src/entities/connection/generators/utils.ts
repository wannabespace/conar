import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '../components/table/cell/utils'

export type GeneratorFormat =
  | 'ts'
  | 'zod'
  | 'prisma'
  | 'sql'
  | 'drizzle'
  | 'kysely'

export interface Index {
  type?: string
  schema: string
  table: string
  name: string
  column: string | null
  customExpression?: string
  isUnique: boolean
  isPrimary: boolean
}

export interface GroupedIndex extends Pick<
  Index,
  'type' | 'name' | 'isUnique' | 'isPrimary'
> {
  columns: string[]
  customExpressions: string[]
}

export const isValidIdentifier = (name: string): boolean =>
  /^[a-z_$][\w$]*$/iu.test(name)

export const toLiteralKey = (name: string) =>
  isValidIdentifier(name) ? name : `'${name}'`

export const formatEnumAsUnionType = (
  values: string[],
  isArray?: boolean
): string => {
  const union = values.map((v) => `'${v}'`).join(' | ')
  return isArray ? `(${union})[]` : union
}

// `interval` and `point` contain "int"; word-bounded so only integer types match
const INT_RE = /\bu?(?:big|small|tiny|medium)?int(?:eger|\d+)?\b|serial/iu

export const isNowDefault = (value: string) =>
  /^\(*(?:now|current_timestamp|getdate|getutcdate|sysdatetime)(?:\(\))?\)*$/iu.test(
    value
  )

export const isSerialDefault = (value: string | null | undefined) =>
  /^nextval\(/iu.test(value ?? '')

const tsMapper = (t: string) => {
  if (INT_RE.test(t) || /float|decimal|number|double|numeric/iu.test(t)) {
    return 'number'
  }
  if (/bool|bit/iu.test(t)) {
    return 'boolean'
  }
  if (/date|time/iu.test(t)) {
    return 'Date'
  }
  if (/json/iu.test(t)) {
    return 'unknown'
  }
  return 'string'
}

const zodMapper = (t: string) => {
  if (INT_RE.test(t) || /float|decimal|number|double|numeric/iu.test(t)) {
    return 'z.number()'
  }
  if (/bool|bit/iu.test(t)) {
    return 'z.boolean()'
  }
  if (/date|time/iu.test(t)) {
    return 'z.date()'
  }
  if (/json/iu.test(t)) {
    return 'z.record(z.string(), z.any())'
  }
  return 'z.string()'
}

const prismaScalarMapper = (t: string) => {
  if (/decimal|numeric/iu.test(t)) {
    return 'Decimal'
  }
  if (/bool/iu.test(t)) {
    return 'Boolean'
  }
  if (/date|timestamp/iu.test(t)) {
    return 'DateTime'
  }
  if (/json/iu.test(t)) {
    return 'Json'
  }
  if (/bigint|bigserial/iu.test(t)) {
    return 'BigInt'
  }
  if (INT_RE.test(t)) {
    return 'Int'
  }
  if (/float|double|real/iu.test(t)) {
    return 'Float'
  }
  return 'String'
}

type TypeMapper = (type: string) => string

const identity: TypeMapper = (t) => t

const drizzleMssqlMapper: TypeMapper = (t) => {
  if (/datetime2/iu.test(t)) {
    return 'datetime2'
  }
  if (/datetime/iu.test(t)) {
    return 'datetime'
  }
  if (/date/iu.test(t)) {
    return 'date'
  }
  if (/bigint/iu.test(t)) {
    return 'bigint'
  }
  if (INT_RE.test(t)) {
    return 'int'
  }
  if (/bit|bool/iu.test(t)) {
    return 'bit'
  }
  if (/text/iu.test(t)) {
    return 'text'
  }
  if (/nvarchar/iu.test(t)) {
    return 'nvarchar'
  }
  if (/varchar/iu.test(t)) {
    return 'varchar'
  }
  if (/decimal|numeric/iu.test(t)) {
    return 'decimal'
  }
  if (/float|real/iu.test(t)) {
    return 'float'
  }
  return 'text'
}

const drizzleMysqlMapper: TypeMapper = (t) => {
  if (/serial/iu.test(t)) {
    return 'serial'
  }
  if (/tinyint/iu.test(t)) {
    return 'tinyint'
  }
  if (/bigint/iu.test(t)) {
    return 'bigint'
  }
  if (INT_RE.test(t)) {
    return 'int'
  }
  if (/text/iu.test(t)) {
    return 'text'
  }
  if (/varchar/iu.test(t)) {
    return 'varchar'
  }
  if (/bool/iu.test(t)) {
    return 'boolean'
  }
  if (/timestamp/iu.test(t)) {
    return 'timestamp'
  }
  if (/datetime/iu.test(t)) {
    return 'datetime'
  }
  if (/date/iu.test(t)) {
    return 'date'
  }
  if (/decimal|numeric/iu.test(t)) {
    return 'decimal'
  }
  if (/double|float|real/iu.test(t)) {
    return 'double'
  }
  if (/json/iu.test(t)) {
    return 'json'
  }
  return 'text'
}

const drizzlePostgresMapper: TypeMapper = (t) => {
  if (/serial/iu.test(t)) {
    return 'serial'
  }
  if (/bigint/iu.test(t)) {
    return 'bigint'
  }
  if (/smallint/iu.test(t)) {
    return 'smallint'
  }
  if (INT_RE.test(t)) {
    return 'integer'
  }
  if (/uuid/iu.test(t)) {
    return 'uuid'
  }
  if (/jsonb/iu.test(t)) {
    return 'jsonb'
  }
  if (/text/iu.test(t)) {
    return 'text'
  }
  if (/varchar|character varying/iu.test(t)) {
    return 'varchar'
  }
  if (/bool/iu.test(t)) {
    return 'boolean'
  }
  if (/timestamp/iu.test(t)) {
    return 'timestamp'
  }
  if (/date/iu.test(t)) {
    return 'date'
  }
  if (/decimal|numeric/iu.test(t)) {
    return 'numeric'
  }
  if (/double|float|real/iu.test(t)) {
    return 'doublePrecision'
  }
  if (/json/iu.test(t)) {
    return 'json'
  }
  return 'text'
}

const TYPE_MAPPINGS: Record<
  GeneratorFormat,
  TypeMapper | Partial<Record<ConnectionType, TypeMapper>>
> = {
  drizzle: {
    mssql: drizzleMssqlMapper,
    mysql: drizzleMysqlMapper,
    postgres: drizzlePostgresMapper,
  },
  kysely: identity,
  prisma: {
    mssql: (t) =>
      /^date$/iu.test(t) ? 'DateTime @db.Date' : prismaScalarMapper(t),
    mysql: prismaScalarMapper,
    postgres: prismaScalarMapper,
  },
  sql: identity,
  ts: tsMapper,
  zod: zodMapper,
}

export const getColumnType = (
  type: string,
  format: GeneratorFormat,
  dialect: ConnectionType
) => {
  const mapping = TYPE_MAPPINGS[format]
  return typeof mapping === 'function'
    ? mapping(type)
    : (mapping[dialect] ?? identity)(type)
}

export const formatValue = (value: unknown) => {
  if (value === null) {
    return 'NULL'
  }
  if (typeof value === 'string') {
    return `'${value.replaceAll("'", "''")}'`
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`
  }
  return `'${String(value)}'`
}

const QUOTE_IDENTIFIER_MAP: Record<ConnectionType, (name: string) => string> = {
  clickhouse: (name: string) => `\`${name}\``,
  mssql: (name: string) => `[${name}]`,
  mysql: (name: string) => `\`${name}\``,
  postgres: (name: string) => `"${name}"`,
}

export const quoteIdentifier = (name: string, dialect: ConnectionType) =>
  QUOTE_IDENTIFIER_MAP[dialect](name)

export const groupIndexes = (
  indexes: Index[],
  schema: string,
  table: string
): GroupedIndex[] => {
  const grouped = new Map<string, GroupedIndex>()

  for (const idx of indexes) {
    if (idx.table !== table || idx.schema !== schema) {
      continue
    }

    const existing = grouped.get(idx.name)
    if (existing) {
      if (idx.column) {
        existing.columns.push(idx.column)
      }
      if (idx.customExpression) {
        existing.customExpressions.push(idx.customExpression)
      }
    } else {
      grouped.set(idx.name, {
        columns: idx.column ? [idx.column] : [],
        customExpressions: idx.customExpression ? [idx.customExpression] : [],
        isPrimary: idx.isPrimary,
        isUnique: idx.isUnique,
        name: idx.name,
        type: idx.type,
      })
    }
  }

  return [...grouped.values()]
}

export const filterExplicitIndexes = (
  grouped: GroupedIndex[],
  columns: Column[]
): GroupedIndex[] =>
  grouped.filter(
    (idx) =>
      !idx.isPrimary &&
      !(
        idx.isUnique &&
        idx.columns.length === 1 &&
        columns.some((c) => c.id === idx.columns[0] && c.unique)
      )
  )
