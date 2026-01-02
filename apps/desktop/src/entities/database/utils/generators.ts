import type { ActiveFilter } from '@conar/shared/filters'
import type { enumType } from '../sql/enums'
import type { Column } from './table'
import type { DatabaseDialect } from './types'
import { findEnum, formatValue, getColumnType, quoteIdentifier, sanitize, toPascalCase } from './helpers'
import * as templates from './templates'

export function generateQuerySQL(table: string, filters: ActiveFilter[]) {
  const whereClauses = filters.map((f) => {
    const col = `"${f.column}"`
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
    const colName = f.column.match(/^[a-z_$][\w$]*$/i) ? f.column : `"${f.column}"`
    return { ...acc, [colName]: value }
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

export function generateSchemaSQL(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: DatabaseDialect = 'postgres') {
  const foreignKeys: string[] = []
  const usedEnums = new Map<string, typeof enumType.infer>()
  const isMysql = dialect === 'mysql'
  const isMssql = dialect === 'mssql'
  const isClickhouse = dialect === 'clickhouse'
  const pkColumns: string[] = []

  const cols = columns.map((c) => {
    let typeDef = c.type ?? ''
    const lowerType = typeDef.toLowerCase()

    const match = findEnum(c, table, enums)

    if (match || lowerType === 'enum' || lowerType === 'set' || (isClickhouse && lowerType.startsWith('enum'))) {
      if (match && match.values.length > 0) {
        if (isClickhouse) {
          const prefix = match.values.length > 255 ? 'Enum16' : 'Enum8'
          const valuesList = match.values.map((v, i) => `'${v.replace(/'/g, '\'\'')}' = ${i + 1}`).join(', ')
          typeDef = `${prefix}(${valuesList})`
        }
        else if (isMysql) {
          const valuesList = match.values.map(v => `'${v.replace(/'/g, '\'\'')}'`).join(', ')
          typeDef = `${lowerType.toUpperCase()}(${valuesList})`
        }
        else {
          if (!isMssql) {
            usedEnums.set(match.name, match)
            typeDef = `"${match.name}"`
          }
          else {
            typeDef = match.name
          }
        }
      }
      else if (c.enum) {
        if (isMysql && c.enum.includes('\'')) {
          typeDef = `ENUM(${c.enum})`
        }
        else {
          typeDef = c.enum
        }
      }
    }
    const parts = [quoteIdentifier(c.id, dialect), typeDef]
    if (!c.isNullable)
      parts.push('NOT NULL')

    if (c.primaryKey) {
      pkColumns.push(quoteIdentifier(c.id, dialect))
      if (isMysql && /int|serial/i.test(c.type || ''))
        parts.push('AUTO_INCREMENT')
      if (isMssql && /int/i.test(c.type || ''))
        parts.push('IDENTITY(1,1)')
    }

    if (c.primaryKey && !isClickhouse)
      parts.push('PRIMARY KEY')

    if (c.foreign && !isClickhouse) {
      foreignKeys.push(`FOREIGN KEY (${quoteIdentifier(c.id, dialect)}) REFERENCES ${quoteIdentifier(c.foreign.table, dialect)}(${quoteIdentifier(c.foreign.column, dialect)})`)
    }

    return `  ${parts.join(' ')}`
  })

  if (foreignKeys.length > 0) {
    cols.push(...foreignKeys.map(fk => `  ${fk}`))
  }

  const definitions: string[] = []

  if (usedEnums.size > 0 && !isMysql && !isMssql && !isClickhouse) {
    usedEnums.forEach((e) => {
      const vals = e.values.map(v => `'${v.replace(/'/g, '\'\'')}'`).join(', ')
      definitions.push(`CREATE TYPE "${e.name}" AS ENUM (${vals});`)
    })
  }

  const columnsString = cols.join(',\n')
  let schema = templates.sqlSchemaTemplate(quoteIdentifier(table, dialect), columnsString)

  if (isClickhouse) {
    const orderBy = pkColumns.length > 0 ? (pkColumns.length > 1 ? `(${pkColumns.join(', ')})` : pkColumns[0]) : 'tuple()'
    schema = schema.replace(/\);\s*$/, `) ENGINE = MergeTree() ORDER BY ${orderBy};`)
  }

  return definitions.length > 0 ? `${definitions.join('\n')}\n\n${schema}` : schema
}

export function generateSchemaTypeScript(table: string, columns: Column[], enums: typeof enumType.infer[] = []) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let typeScriptType = getColumnType(c.type, 'ts')

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      typeScriptType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        typeScriptType = `(${typeScriptType})[]`
    }

    return `  ${safeId}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}

export function generateSchemaZod(table: string, columns: Column[], enums: typeof enumType.infer[] = []) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let t = getColumnType(c.type, 'zod')

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      const valuesArr = match.values.map(v => `'${v}'`).join(', ')
      t = `z.enum([${valuesArr}])`
      if (c.type === 'set')
        t = `${t}.array()`
    }

    if (c.isNullable)
      t += '.nullable()'
    return `  ${safeId}: ${t},`
  }).join('\n')

  return templates.zodSchemaTemplate(table, cols)
}

export function generateSchemaPrisma(table: string, columns: Column[], enums: typeof enumType.infer[] = []) {
  const extraBlocks: string[] = []
  const relations: string[] = []

  const cols = columns.map((c) => {
    let prismaType = getColumnType(c.type, 'prisma')

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      const enumName = toPascalCase(match.name || `${table}_${c.id}`)
      prismaType = enumName

      const enumValues = match.values.map((v) => {
        if (/^[a-z]\w*$/i.test(v))
          return `  ${v}`
        return `  ${sanitize(v)} @map("${v}")`
      }).join('\n')

      extraBlocks.push(`enum ${enumName} {\n${enumValues}\n}`)
    }

    const isValidId = /^[a-z][\w$]*$/i.test(c.id)
    const fieldName = isValidId ? c.id : sanitize(c.id)
    const needsMap = !isValidId

    const parts = [fieldName, prismaType + (c.isNullable ? '?' : '')]
    if (c.primaryKey) {
      parts.push('@id')
      if (prismaType === 'Int')
        parts.push('@default(autoincrement())')
    }

    if (needsMap) {
      parts.push(`@map("${c.id}")`)
    }

    if (c.foreign) {
      const relName = c.foreign.table.toLowerCase()
      const relType = toPascalCase(c.foreign.table)
      relations.push(`  ${relName} ${relType} @relation(fields: [${fieldName}], references: [${c.foreign.column}])`)
    }

    return `  ${parts.join(' ')}`
  })

  const body = cols.join('\n') + (relations.length ? `\n\n${relations.join('\n')}` : '')

  const uniqueExtras = Array.from(new Set(extraBlocks))

  return templates.prismaSchemaTemplate(table, body) + (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
}

export function generateSchemaDrizzle(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: DatabaseDialect = 'postgres') {
  let tableFunc = 'pgTable'
  let importPath = 'drizzle-orm/pg-core'
  let enumFunc = 'pgEnum'

  if (dialect === 'mysql') {
    tableFunc = 'mysqlTable'
    importPath = 'drizzle-orm/mysql-core'
    enumFunc = 'mysqlEnum'
  }
  else if (dialect === 'mssql') {
    tableFunc = 'mssqlTable'
    importPath = 'drizzle-orm/mssql-core'
    enumFunc = ''
  }
  else if (dialect === 'clickhouse') {
    tableFunc = 'clickhouseTable'
    importPath = 'drizzle-orm/clickhouse-core'
    enumFunc = 'enum'
  }

  const imports = new Set<string>()
  const extras: string[] = []

  const cols = columns.map((c) => {
    let typeFunc = getColumnType(c.type, 'drizzle')
    imports.add(typeFunc)

    let enumVarName = ''

    const match = findEnum(c, table, enums)
    if (enumFunc && match?.values.length) {
      const eName = match.name || `${table}_${c.id}`
      enumVarName = `${eName}Enum`
      const valuesList = match.values.map(v => `'${v}'`).join(', ')

      imports.add(enumFunc)
      extras.push(`export const ${enumVarName} = ${enumFunc}('${eName}', [${valuesList}]);`)

      typeFunc = enumVarName
    }

    const safeKey = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`

    let chain = ''
    if (enumVarName) {
      chain = `${enumVarName}('${c.id}')`
    }
    else {
      chain = `${typeFunc}('${c.id}')`
    }

    if (!c.isNullable)
      chain += '.notNull()'
    if (c.primaryKey)
      chain += '.primaryKey()'

    if (c.foreign && dialect !== 'clickhouse') {
      const refTable = toPascalCase(c.foreign.table)
      chain += `.references(() => ${refTable}.${c.foreign.column})`
    }

    return `  ${safeKey}: ${chain},`
  }).join('\n')

  const base = templates.drizzleSchemaTemplate(table, Array.from(imports), cols, tableFunc, importPath)
  return (extras.length ? `${extras.join('\n')}\n\n` : '') + base
}

export function generateSchemaKysely(table: string, columns: Column[], enums: typeof enumType.infer[] = []) {
  const body = columns.map((c) => {
    let tsType = getColumnType(c.type, 'ts')

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      tsType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        tsType = `(${tsType})[]`
    }

    const isGenerated = c.primaryKey
    const typeDef = isGenerated ? `Generated<${tsType}>` : tsType
    const safeKey = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    return `  ${safeKey}: ${typeDef};`
  }).join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
