import type { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { Column } from '../components/table/cell'

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
  columnType?: string
): string => {
  const union = values.map((v) => `'${v}'`).join(' | ')
  return columnType === 'set' ? `(${union})[]` : union
}

const tsMapper = (t: string) => {
  if (/int|float|decimal|number|double|numeric/iu.test(t)) {
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
  if (/int|float|decimal|number|double|numeric/iu.test(t)) {
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
  if (/int/iu.test(t)) {
    return 'Int'
  }
  if (/float/iu.test(t)) {
    return 'Float'
  }
  return 'String'
}

const TYPE_MAPPINGS: Record<
  GeneratorFormat,
  Record<ConnectionType, (type: string) => string>
> = {
  drizzle: {
    clickhouse: (t) => {
      if (/int/iu.test(t)) {
        return 'integer'
      }
      if (/text/iu.test(t)) {
        return 'text'
      }
      if (/bool/iu.test(t)) {
        return 'boolean'
      }
      if (/date/iu.test(t)) {
        return 'date'
      }
      if (/decimal/iu.test(t)) {
        return 'decimal'
      }
      if (/real|float/iu.test(t)) {
        return 'real'
      }
      if (/json/iu.test(t)) {
        return 'json'
      }
      return 'text'
    },
    mssql: (t) => {
      if (/datetime2/iu.test(t)) {
        return 'datetime2'
      }
      if (/datetime/iu.test(t)) {
        return 'datetime'
      }
      if (/date/iu.test(t)) {
        return 'date'
      }
      if (/int/iu.test(t)) {
        return 'integer'
      }
      if (/bit/iu.test(t)) {
        return 'bit'
      }
      if (/bool/iu.test(t)) {
        return 'boolean'
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
    },
    mysql: (t) => {
      if (/serial/iu.test(t)) {
        return 'serial'
      }
      if (/tinyint/iu.test(t)) {
        return 'tinyint'
      }
      if (/int/iu.test(t)) {
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
    },
    postgres: (t) => {
      if (/serial/iu.test(t)) {
        return 'serial'
      }
      if (/int/iu.test(t)) {
        return 'integer'
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
        return 'decimal'
      }
      if (/double|float|real/iu.test(t)) {
        return 'doublePrecision'
      }
      if (/json/iu.test(t)) {
        return 'json'
      }
      return 'text'
    },
  },
  kysely: {
    clickhouse: (t) => t,
    mssql: (t) => t,
    mysql: (t) => t,
    postgres: (t) => t,
  },
  prisma: {
    clickhouse: () => '',
    mssql: (t) =>
      /^date$/iu.test(t) ? 'DateTime @db.Date' : prismaScalarMapper(t),
    mysql: prismaScalarMapper,
    postgres: prismaScalarMapper,
  },
  sql: {
    clickhouse: (t) => t,
    mssql: (t) => t,
    mysql: (t) => t,
    postgres: (t) => {
      if (/datetime2/iu.test(t)) {
        return 'timestamp'
      }
      if (/nvarchar/iu.test(t)) {
        return 'varchar'
      }
      if (/int32/iu.test(t)) {
        return 'integer'
      }
      return t
    },
  },
  ts: {
    clickhouse: tsMapper,
    mssql: tsMapper,
    mysql: tsMapper,
    postgres: tsMapper,
  },
  zod: {
    clickhouse: zodMapper,
    mssql: zodMapper,
    mysql: zodMapper,
    postgres: zodMapper,
  },
}

export const getColumnType = (
  type: string,
  format: GeneratorFormat,
  dialect: ConnectionType
) => TYPE_MAPPINGS[format][dialect](type)

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
  table: string
): GroupedIndex[] => {
  const grouped = new Map<string, GroupedIndex>()

  for (const idx of indexes) {
    if (idx.table !== table) {
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
  columns: Column[],
  dialect?: ConnectionType
): GroupedIndex[] =>
  grouped.filter((idx) => {
    if (idx.isPrimary) {
      return false
    }
    if (dialect === 'clickhouse') {
      return false
    }
    const isRedundantUnique =
      idx.isUnique &&
      idx.columns.length === 1 &&
      columns.some((c) => c.id === idx.columns[0] && c.unique)
    if (isRedundantUnique) {
      return false
    }
    return true
  })
