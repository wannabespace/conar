import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import type { Column } from '~/core/table/cell/utils'

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
  custom?: boolean
  definition?: string
  isUnique: boolean
  isPrimary: boolean
}

export type IndexKey = { column: string } | { expression: string }

export interface GroupedIndex extends Pick<
  Index,
  'type' | 'name' | 'isUnique' | 'isPrimary' | 'custom' | 'definition'
> {
  columns: string[]
  keys: IndexKey[]
}

export const isValidIdentifier = (name: string): boolean =>
  /^[a-z_$][\w$]*$/iu.test(name)

export const toStringLiteral = (value: string) =>
  `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

export const toLiteralKey = (name: string) =>
  isValidIdentifier(name) ? name : toStringLiteral(name)

export const formatEnumAsUnionType = (
  values: string[],
  isArray?: boolean
): string => {
  const union = values.map(toStringLiteral).join(' | ')
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
    return 'z.json()'
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
  if (/bigint|bigserial|\bint8\b/iu.test(t)) {
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
  if (/bigint|\bint8\b/iu.test(t)) {
    return 'bigint'
  }
  if (/smallint|\bint2\b/iu.test(t)) {
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
  if (/^time/iu.test(t)) {
    return 'time'
  }
  if (/date/iu.test(t)) {
    return 'date'
  }
  if (/decimal|numeric/iu.test(t)) {
    return 'numeric'
  }
  if (/real|float4/iu.test(t)) {
    return 'real'
  }
  if (/double|float/iu.test(t)) {
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

const QUOTE_IDENTIFIER_MAP: Record<ConnectionType, (name: string) => string> = {
  clickhouse: (name: string) => `\`${name.replaceAll('`', '``')}\``,
  mssql: (name: string) => `[${name.replaceAll(']', ']]')}]`,
  mysql: (name: string) => `\`${name.replaceAll('`', '``')}\``,
  postgres: (name: string) => `"${name.replaceAll('"', '""')}"`,
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

    const entry = grouped.get(idx.name) ?? {
      columns: [],
      custom: idx.custom,
      definition: idx.definition,
      isPrimary: idx.isPrimary,
      isUnique: idx.isUnique,
      keys: [],
      name: idx.name,
      type: idx.type,
    }
    grouped.set(idx.name, entry)
    if (idx.column) {
      entry.columns.push(idx.column)
      entry.keys.push({ column: idx.column })
    } else if (idx.customExpression) {
      entry.keys.push({ expression: idx.customExpression })
    }
  }

  return [...grouped.values()]
}

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

export const filterExplicitIndexes = (
  grouped: GroupedIndex[],
  columns: Column[]
): GroupedIndex[] =>
  grouped.filter(
    (idx) =>
      !idx.isPrimary &&
      idx.keys.length > 0 &&
      !(
        idx.isUnique &&
        idx.columns.length === 1 &&
        columns.some(
          (c) =>
            c.id === idx.columns[0] &&
            isSingleColumnConstraint(c, columns, 'unique')
        )
      )
  )
