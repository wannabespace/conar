import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '../components/table/utils'

export type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'

export interface Index {
  schema: string
  table: string
  name: string
  column: string
  isUnique: boolean
  isPrimary: boolean
}

export interface GroupedIndex {
  name: string
  isUnique: boolean
  isPrimary: boolean
  columns: string[]
}

export function toLiteralKey(name: string) {
  return /^[a-z_$][\w$]*$/i.test(name) ? name : `'${name}'`
}

function tsMapper(t: string) {
  if (/int|float|decimal|number|double|numeric/i.test(t))
    return 'number'
  if (/bool|bit/i.test(t))
    return 'boolean'
  if (/date|time/i.test(t))
    return 'Date'
  if (/json/i.test(t))
    return 'unknown'
  return 'string'
}

function zodMapper(t: string) {
  if (/int|float|decimal|number|double|numeric/i.test(t))
    return 'z.number()'
  if (/bool|bit/i.test(t))
    return 'z.boolean()'
  if (/date|time/i.test(t))
    return 'z.date()'
  if (/json/i.test(t))
    return 'z.record(z.string(), z.any())'
  return 'z.string()'
}

function prismaScalarMapper(t: string) {
  if (/decimal|numeric/i.test(t))
    return 'Decimal'
  if (/bool/i.test(t))
    return 'Boolean'
  if (/date|timestamp/i.test(t))
    return 'DateTime'
  if (/json/i.test(t))
    return 'Json'
  if (/int/i.test(t))
    return 'Int'
  if (/float/i.test(t))
    return 'Float'
  return 'String'
}

export const TYPE_MAPPINGS: Record<GeneratorFormat, Record<ConnectionType, (type: string) => string>> = {
  ts: {
    postgres: tsMapper,
    mysql: tsMapper,
    mssql: tsMapper,
    clickhouse: tsMapper,
  },
  zod: {
    postgres: zodMapper,
    mysql: zodMapper,
    mssql: zodMapper,
    clickhouse: zodMapper,
  },
  prisma: {
    postgres: prismaScalarMapper,
    mysql: prismaScalarMapper,
    mssql: t => (/^date$/i.test(t) ? 'DateTime @db.Date' : prismaScalarMapper(t)),
    clickhouse: () => '',
  },
  drizzle: {
    postgres: (t) => {
      if (/serial/i.test(t))
        return 'serial'
      if (/int/i.test(t))
        return 'integer'
      if (/text/i.test(t))
        return 'text'
      if (/varchar|character varying/i.test(t))
        return 'varchar'
      if (/bool/i.test(t))
        return 'boolean'
      if (/timestamp/i.test(t))
        return 'timestamp'
      if (/date/i.test(t))
        return 'date'
      if (/decimal|numeric/i.test(t))
        return 'decimal'
      if (/double|float|real/i.test(t))
        return 'doublePrecision'
      if (/json/i.test(t))
        return 'json'
      return 'text'
    },
    mysql: (t) => {
      if (/serial/i.test(t))
        return 'serial'
      if (/tinyint/i.test(t))
        return 'tinyint'
      if (/int/i.test(t))
        return 'int'
      if (/text/i.test(t))
        return 'text'
      if (/varchar/i.test(t))
        return 'varchar'
      if (/bool/i.test(t))
        return 'boolean'
      if (/timestamp/i.test(t))
        return 'timestamp'
      if (/datetime/i.test(t))
        return 'datetime'
      if (/date/i.test(t))
        return 'date'
      if (/decimal|numeric/i.test(t))
        return 'decimal'
      if (/double|float|real/i.test(t))
        return 'double'
      if (/json/i.test(t))
        return 'json'
      return 'text'
    },
    mssql: (t) => {
      if (/datetime2/i.test(t))
        return 'datetime2'
      if (/datetime/i.test(t))
        return 'datetime'
      if (/date/i.test(t))
        return 'date'
      if (/int/i.test(t))
        return 'integer'
      if (/bit/i.test(t))
        return 'bit'
      if (/bool/i.test(t))
        return 'boolean'
      if (/text/i.test(t))
        return 'text'
      if (/nvarchar/i.test(t))
        return 'nvarchar'
      if (/varchar/i.test(t))
        return 'varchar'
      if (/decimal|numeric/i.test(t))
        return 'decimal'
      if (/float|real/i.test(t))
        return 'float'
      return 'text'
    },
    clickhouse: (t) => {
      if (/int/i.test(t))
        return 'integer'
      if (/text/i.test(t))
        return 'text'
      if (/bool/i.test(t))
        return 'boolean'
      if (/date/i.test(t))
        return 'date'
      if (/decimal/i.test(t))
        return 'decimal'
      if (/real|float/i.test(t))
        return 'real'
      if (/json/i.test(t))
        return 'json'
      return 'text'
    },
  },
  sql: {
    postgres: (t) => {
      if (/datetime2/i.test(t))
        return 'timestamp'
      if (/nvarchar/i.test(t))
        return 'varchar'
      if (/int32/i.test(t))
        return 'integer'
      return t
    },
    mysql: t => t,
    mssql: t => t,
    clickhouse: t => t,
  },
  kysely: {
    postgres: t => t,
    mysql: t => t,
    mssql: t => t,
    clickhouse: t => t,
  },
}

export function getColumnType(type: string, format: GeneratorFormat, dialect: ConnectionType) {
  return TYPE_MAPPINGS[format][dialect](type)
}

export function formatValue(value: unknown) {
  if (value === null)
    return 'NULL'
  if (typeof value === 'string')
    return `'${value.replace(/'/g, '\'\'')}'`
  if (typeof value === 'number')
    return String(value)
  if (typeof value === 'boolean')
    return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date)
    return `'${value.toISOString()}'`
  return `'${String(value)}'`
}

const QUOTE_IDENTIFIER_MAP: Record<ConnectionType, (name: string) => string> = {
  mysql: (name: string) => `\`${name}\``,
  clickhouse: (name: string) => `\`${name}\``,
  mssql: (name: string) => `[${name}]`,
  postgres: (name: string) => `"${name}"`,
}

export function quoteIdentifier(name: string, dialect: ConnectionType) {
  return QUOTE_IDENTIFIER_MAP[dialect](name)
}

export function groupIndexes(indexes: Index[] = [], table: string): GroupedIndex[] {
  const grouped = new Map<string, GroupedIndex>()

  for (const idx of indexes) {
    if (idx.table !== table)
      continue

    const existing = grouped.get(idx.name)
    if (existing) {
      existing.columns.push(idx.column)
    }
    else {
      grouped.set(idx.name, {
        name: idx.name,
        isUnique: idx.isUnique,
        isPrimary: idx.isPrimary,
        columns: [idx.column],
      })
    }
  }

  return Array.from(grouped.values())
}

export function filterExplicitIndexes(
  grouped: GroupedIndex[],
  columns: Column[],
  dialect?: ConnectionType,
): GroupedIndex[] {
  return grouped.filter((idx) => {
    if (idx.isPrimary)
      return false
    if (dialect === 'clickhouse')
      return false
    const isRedundantUnique = idx.isUnique && idx.columns.length === 1
      && columns.some(c => c.id === idx.columns[0] && c.unique)
    if (isRedundantUnique)
      return false
    return true
  })
}
