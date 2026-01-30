import { ConnectionType } from '@conar/shared/enums/connection-type'
import { pascalCase } from 'change-case'

export type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'

export interface Index {
  schema: string
  table: string
  name: string
  column: string
  isUnique: boolean
  isPrimary: boolean
}

export function sanitize(name: string) {
  return name.replace(/\W/g, '_')
}

export function safePascalCase(name: string) {
  const replaced = name
    .replace(/ /g, '_Space_')
    .replace(/-/g, '_Minus_')
    .replace(/\./g, '_Dot_')
    .replace(/@/g, '_At_')
    .replace(/\$/g, '_Dollar_')
    .replace(/%/g, '_Percent_')
    .replace(/&/g, '_Ampersand_')
    .replace(/\*/g, '_Asterisk_')
    .replace(/#/g, '_Hash_')
    .replace(/!/g, '_Exclamation_')
    .replace(/\^/g, '_Caret_')
    .replace(/\(/g, '_OpenParen_')
    .replace(/\)/g, '_CloseParen_')
    .replace(/\+/g, '_Plus_')
    .replace(/=/g, '_Equal_')
    .replace(/\{/g, '_OpenBrace_')
    .replace(/\}/g, '_CloseBrace_')
    .replace(/\[/g, '_OpenBracket_')
    .replace(/\]/g, '_CloseBracket_')
    .replace(/\|/g, '_Pipe_')
    .replace(/\\/g, '_Backslash_')
    .replace(/\//g, '_Slash_')
    .replace(/:/g, '_Colon_')
    .replace(/;/g, '_Semicolon_')
    .replace(/"/g, '_Quote_')
    .replace(/'/g, '_SingleQuote_')
    .replace(/</g, '_LessThan_')
    .replace(/>/g, '_GreaterThan_')
    .replace(/,/g, '_Comma_')
    .replace(/\?/g, '_Question_')
    .replace(/~/g, '_Tilde_')
    .replace(/`/g, '_Backtick_')

  const pascal = pascalCase(replaced)

  if (/^\d/.test(pascal)) {
    return name.startsWith('_') ? `_${pascal}` : `Num${pascal}`
  }

  return pascal
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
    return 'z.unknown()'
  return 'z.string()'
}

const sqlDefault = (t: string) => t
const kyselyDefault = (t: string) => t

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
    postgres: (t) => {
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
    },
    mysql: (t) => {
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
    },
    mssql: (t) => {
      if (/^date$/i.test(t))
        return 'DateTime @db.Date'
      if (/decimal|numeric/i.test(t))
        return 'Decimal'
      if (/bool|bit/i.test(t))
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
    },
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
    mysql: sqlDefault,
    mssql: sqlDefault,
    clickhouse: sqlDefault,
  },
  kysely: {
    postgres: kyselyDefault,
    mysql: kyselyDefault,
    mssql: kyselyDefault,
    clickhouse: kyselyDefault,
  },
}

export function getColumnType(type: string | undefined, format: GeneratorFormat, dialect: ConnectionType = ConnectionType.Postgres): string {
  if (!type)
    return 'any'

  const mapper = TYPE_MAPPINGS[format][dialect]
  return mapper ? mapper(type) : ''
}

export function formatValue(value: unknown): string {
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

export function groupIndexes(indexes: Index[] = [], table: string) {
  const grouped = new Map<string, { name: string, isUnique: boolean, isPrimary: boolean, columns: string[] }>()

  indexes.forEach((idx) => {
    if (idx.table !== table)
      return

    if (!grouped.has(idx.name)) {
      grouped.set(idx.name, {
        name: idx.name,
        isUnique: idx.isUnique,
        isPrimary: idx.isPrimary,
        columns: [],
      })
    }
    grouped.get(idx.name)!.columns.push(idx.column)
  })

  return Array.from(grouped.values())
}
