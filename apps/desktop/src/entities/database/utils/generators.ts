import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from './table'
import * as templates from './templates'

type GeneratorFormat = 'ts' | 'zod' | 'prisma' | 'sql' | 'drizzle' | 'kysely'

const TYPE_MAPPINGS: Record<GeneratorFormat, (type: string) => string> = {
  ts: (t) => {
    if (/int|float|decimal|number|double/i.test(t))
      return 'number'
    if (/bool/i.test(t))
      return 'boolean'
    if (/date|time/i.test(t))
      return 'Date'
    if (/json/i.test(t))
      return 'any'
    return 'string'
  },
  zod: (t) => {
    if (/int|float|decimal|number|double/i.test(t))
      return 'z.number()'
    if (/bool/i.test(t))
      return 'z.boolean()'
    if (/date|time/i.test(t))
      return 'z.date()'
    if (/json/i.test(t))
      return 'z.any()'
    return 'z.string()'
  },
  prisma: (t) => {
    if (/int/i.test(t))
      return 'Int'
    if (/float|double/i.test(t))
      return 'Float'
    if (/decimal/i.test(t))
      return 'Decimal'
    if (/bool/i.test(t))
      return 'Boolean'
    if (/date|timestamp/i.test(t))
      return 'DateTime'
    if (/json/i.test(t))
      return 'Json'
    return 'String'
  },
  drizzle: (t) => {
    if (/serial/i.test(t))
      return 'serial'
    if (/int/i.test(t))
      return 'integer'
    if (/text/i.test(t))
      return 'text'
    if (/varchar/i.test(t))
      return 'varchar'
    if (/bool/i.test(t))
      return 'boolean'
    if (/timestamp/i.test(t))
      return 'timestamp'
    if (/date/i.test(t))
      return 'date'
    if (/json/i.test(t))
      return 'json'
    return 'text'
  },
  sql: t => t,
  kysely: t => t,
}

function getColumnType(type: string | undefined, format: GeneratorFormat): string {
  if (!type)
    return 'any'
  const mapper = TYPE_MAPPINGS[format]
  return mapper ? mapper(type) : type
}

function formatValue(value: unknown): string {
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

export function generateQuerySQL(table: string, filters: ActiveFilter[]) {
  const whereClauses = filters.map((f) => {
    const col = f.column
    const op = f.ref.operator

    if (f.ref.hasValue === false)
      return `${col} ${op}`

    const val = f.ref.isArray
      ? `(${f.values.map(formatValue).join(', ')})`
      : formatValue(f.values[0])

    return `${col} ${op} ${val}`
  }).join(' AND ')

  return templates.sqlQueryTemplate(table, whereClauses)
}

export function generateQueryPrisma(table: string, filters: ActiveFilter[]) {
  const where = filters.reduce((acc, f) => {
    let value = f.values[0] as string | number | boolean | Date | object | null
    const op = f.ref.operator.toUpperCase()

    if (f.ref.isArray) {
      if (op === 'IN')
        value = { in: f.values }
      else if (op === 'NOT IN')
        value = { notIn: f.values }
    }
    else if (f.ref.hasValue === false) {
      if (op === 'IS NULL')
        value = null
      else if (op === 'IS NOT NULL')
        value = { not: null }
    }
    else {
      const opMap: Record<string, string> = {
        '=': 'equals',
        '!=': 'not',
        '>': 'gt',
        '>=': 'gte',
        '<': 'lt',
        '<=': 'lte',
        'LIKE': 'contains',
        'ILIKE': 'contains',
      }
      if (opMap[op]) {
        value = opMap[op] === 'equals' ? value : { [opMap[op]]: value }
      }
    }
    return { ...acc, [f.column]: value }
  }, {})

  const jsonWhere = Object.keys(where).length > 0
    ? JSON.stringify(where, null, 2).replace(/"([^"]+)":/g, '$1:')
    : '{}'

  return templates.prismaQueryTemplate(table, jsonWhere)
}

export function generateQueryDrizzle(table: string, filters: ActiveFilter[]) {
  const conditions = filters.map((f) => {
    const op = f.ref.operator.toUpperCase()
    const col = `${table}.${f.column}`
    const val = JSON.stringify(f.values[0])
    const arrVal = JSON.stringify(f.values)

    switch (op) {
      case '=': return `eq(${col}, ${val})`
      case '!=': return `ne(${col}, ${val})`
      case '>': return `gt(${col}, ${val})`
      case '>=': return `gte(${col}, ${val})`
      case '<': return `lt(${col}, ${val})`
      case '<=': return `lte(${col}, ${val})`
      case 'IS NULL': return `isNull(${col})`
      case 'IS NOT NULL': return `isNotNull(${col})`
      case 'IN': return `inArray(${col}, ${arrVal})`
      case 'NOT IN': return `notInArray(${col}, ${arrVal})`
      case 'LIKE': return `like(${col}, ${val})`
      case 'ILIKE': return `ilike(${col}, ${val})`
      default: return undefined
    }
  }).filter(Boolean).join(', ')

  return templates.drizzleQueryTemplate(table, conditions)
}

export function generateQueryKysely(table: string, filters: ActiveFilter[]) {
  const conditions = filters.map((f) => {
    const op = f.ref.operator.toUpperCase()
    const col = f.column

    if (f.ref.hasValue === false) {
      return `'${col}', '${f.ref.operator.toLowerCase()}'`
    }
    else if (f.ref.isArray) {
      const method = op === 'IN' ? 'in' : 'not in'
      return `'${col}', '${method}', ${JSON.stringify(f.values)}`
    }
    else {
      return `'${col}', '${f.ref.operator}', ${formatValue(f.values[0])}`
    }
  }).filter(Boolean).join(').where(')

  return templates.kyselyQueryTemplate(table, conditions)
}

export function generateSchemaSQL(table: string, columns: Column[]) {
  const cols = columns.map((c) => {
    const parts = [c.id, c.type]
    if (!c.isNullable)
      parts.push('NOT NULL')

    if (c.primaryKey)
      parts.push('PRIMARY KEY')
    return `  ${parts.join(' ')}`
  }).join(',\n')

  return templates.sqlSchemaTemplate(table, cols)
}

export function generateSchemaTypeScript(table: string, columns: Column[]) {
  const cols = columns.map(c =>
    `  ${c.id}${c.isNullable ? '?' : ''}: ${getColumnType(c.type, 'ts')};`,
  ).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}

export function generateSchemaZod(table: string, columns: Column[]) {
  const cols = columns.map((c) => {
    let t = getColumnType(c.type, 'zod')
    if (c.isNullable)
      t += '.nullable()'
    return `  ${c.id}: ${t},`
  }).join('\n')

  return templates.zodSchemaTemplate(table, cols)
}

export function generateSchemaPrisma(table: string, columns: Column[]) {
  const cols = columns.map((c) => {
    const prismaType = getColumnType(c.type, 'prisma')
    const parts = [c.id, prismaType + (c.isNullable ? '?' : '')]
    if (c.primaryKey) {
      parts.push('@id')
      if (prismaType === 'Int')
        parts.push('@default(autoincrement())')
    }
    return `  ${parts.join(' ')}`
  }).join('\n')

  return templates.prismaSchemaTemplate(table, cols)
}

export function generateSchemaDrizzle(table: string, columns: Column[]) {
  const imports = new Set(columns.map(c => getColumnType(c.type, 'drizzle')))

  const cols = columns.map((c) => {
    const typeFunc = getColumnType(c.type, 'drizzle')
    let chain = `${typeFunc}('${c.id}')`
    if (!c.isNullable)
      chain += '.notNull()'
    if (c.primaryKey)
      chain += '.primaryKey()'
    return `  ${c.id}: ${chain},`
  }).join('\n')

  return templates.drizzleSchemaTemplate(table, Array.from(imports), cols)
}

export function generateSchemaKysely(table: string, columns: Column[]) {
  const body = columns.map((c) => {
    const tsType = getColumnType(c.type, 'ts')
    const isGenerated = c.primaryKey
    const typeDef = isGenerated ? `Generated<${tsType}>` : tsType
    return `  ${c.id}: ${typeDef};`
  }).join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
