import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../components/table/utils'
import type { enumType } from '../sql/enums'
import type { ConnectionDialect, Index, PrismaFilterValue } from './types'
import { findEnum, formatValue, getColumnType, groupIndexes, isPrismaFilterValue, quoteIdentifier, sanitize, toPascalCase } from './helpers'
import * as templates from './templates'

export function generateQuerySQL(table: string, filters: ActiveFilter[]) {
  // TODO: use kysely to generate the query
  const whereClauses = filters.map((f) => {
    const col = `"${f.column}"`
    const op = f.ref.operator

    if (f.ref.hasValue === false)
      return `${col} ${op}`

    const val = f.ref.isArray
      ? `(${f.values.map(formatValue).join(', ')})`
      : formatValue(f.values[0])

    return `${col} ${op} ${val}`
  }).join('\n  AND ')

  return templates.sqlQueryTemplate(table, whereClauses)
}

export function generateQueryPrisma(table: string, filters: ActiveFilter[]) {
  const where = filters.reduce<Record<string, PrismaFilterValue>>((acc: Record<string, PrismaFilterValue>, f) => {
    const value = f.values[0]
    let finalValue: PrismaFilterValue
    const op = f.ref.operator.toUpperCase()

    if (f.ref.isArray) {
      if (op === 'IN')
        finalValue = { in: f.values.filter(isPrismaFilterValue) }
      else if (op === 'NOT IN')
        finalValue = { notIn: f.values.filter(isPrismaFilterValue) }
      else
        return acc
    }
    else if (f.ref.hasValue === false) {
      if (op === 'IS NULL')
        finalValue = null
      else if (op === 'IS NOT NULL')
        finalValue = { not: null }
      else
        return acc
    }
    else {
      if (!isPrismaFilterValue(value))
        return acc

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
      if (opMap[op])
        finalValue = opMap[op] === 'equals' ? value : { [opMap[op]]: value }
      else
        return acc
    }

    const colName = f.column.match(/^[a-z_$][\w$]*$/i) ? f.column : `"${f.column}"`

    const existing = acc[colName]
    return { ...acc, [colName]: existing && typeof existing === 'object' && typeof finalValue === 'object' && finalValue !== null && existing !== null ? { ...existing, ...finalValue } : finalValue }
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
  }).filter(Boolean).join(',\n    ')

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
  }).filter(Boolean).join(')\n  .where(')

  return templates.kyselyQueryTemplate(table, conditions)
}

export function generateSchemaSQL(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', indexes: Index[] = []) {
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
    else {
      typeDef = getColumnType(c.type, 'sql', dialect)

      if (c.maxLength) {
        const len = c.maxLength === -1 ? 'MAX' : c.maxLength
        if (/(?:var)?char|binary/i.test(typeDef) && !/text/i.test(typeDef))
          typeDef += `(${len})`
      }

      if (c.precision && /decimal|numeric/i.test(typeDef)) {
        typeDef += `(${c.precision}${c.scale ? `, ${c.scale}` : ''})`
      }

      if (!isClickhouse) {
        typeDef = typeDef.toUpperCase()
      }

      if (isClickhouse && c.isNullable) {
        typeDef = `Nullable(${typeDef})`
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
    else if (c.unique)
      parts.push('UNIQUE')

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

  const explicitIndexes = groupIndexes(indexes, table).filter(idx => !idx.isPrimary && dialect !== 'clickhouse' && !(idx.isUnique && idx.columns.length === 1 && columns.find(c => c.id === idx.columns[0] && c.unique)))

  if (explicitIndexes.length > 0) {
    const indexStmts = explicitIndexes.map((idx) => {
      const cols = idx.columns.map(c => quoteIdentifier(c, dialect)).join(', ')
      const unique = idx.isUnique ? 'UNIQUE ' : ''
      return `CREATE ${unique}INDEX ${quoteIdentifier(idx.name, dialect)} ON ${quoteIdentifier(table, dialect)} (${cols});`
    })
    schema += `\n\n${indexStmts.join('\n')}`
  }

  return definitions.length > 0 ? `${definitions.join('\n')}\n\n${schema}` : schema
}

export function generateSchemaTypeScript(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', _indexes: Index[] = []) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let typeScriptType = getColumnType(c.type, 'ts', dialect)

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

export function generateSchemaZod(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', _indexes: Index[] = []) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let t = getColumnType(c.type, 'zod', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      const valuesArr = match.values.map(v => `'${v}'`).join(', ')
      t = `z.enum([${valuesArr}])`
      if (c.type === 'set')
        t = `${t}.array()`
    }

    if (c.isNullable)
      t += '.nullable()'

    if (c.maxLength && c.maxLength > 0 && t.includes('z.string')) {
      t = t.replace('z.string()', `z.string().max(${c.maxLength})`)
    }

    if (t.includes('z.number()') && /int/i.test(c.type || '')) {
      t = t.replace('z.number()', 'z.int()')
    }

    return `  ${safeId}: ${t},`
  }).join('\n')

  return templates.zodSchemaTemplate(table, cols)
}

export function generateSchemaPrisma(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', indexes: Index[] = []) {
  const extraBlocks: string[] = []
  const relations: string[] = []

  const cols = columns.map((c) => {
    let prismaType = getColumnType(c.type, 'prisma', dialect)

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
    else if (c.unique) {
      parts.push('@unique')
    }

    if (prismaType === 'String' && c.maxLength && c.maxLength > 0) {
      parts.push(`@db.VarChar(${c.maxLength})`)
    }

    if (prismaType === 'Decimal' && c.precision) {
      parts.push(`@db.Decimal(${c.precision}, ${c.scale || 0})`)
    }

    if (needsMap) {
      parts.push(`@map("${c.id}")`)
    }

    if (c.foreign) {
      const relName = c.foreign.table.toLowerCase()
      const relType = toPascalCase(c.foreign.table)
      relations.push(`  ${relName} ${relType} @relation(fields: [${fieldName}], references: [${c.foreign.column}])`)
    }

    if (c.references?.length) {
      c.references.forEach((ref) => {
        const isValidRef = /^[a-z]\w*$/i.test(ref.table)
        const refType = isValidRef ? ref.table : toPascalCase(ref.table)
        const fieldName = ref.table.toLowerCase()

        relations.push(`  ${fieldName} ${refType}[]`)
      })
    }

    return `  ${parts.join(' ')}`
  })

  const explicitIndexes = groupIndexes(indexes, table).filter(idx => !idx.isPrimary && !(idx.isUnique && idx.columns.length === 1 && columns.find(c => c.id === idx.columns[0] && c.unique)))

  const indexBlocks: string[] = []
  explicitIndexes.forEach((idx) => {
    const fieldNames = idx.columns.map((col) => {
      const c = columns.find(c => c.id === col)
      if (!c)
        return col
      const isValidId = /^[a-z][\w$]*$/i.test(c.id)
      return isValidId ? c.id : sanitize(c.id)
    })

    const type = idx.isUnique ? '@@unique' : '@@index'
    const cols = fieldNames.join(', ')

    indexBlocks.push(`  ${type}([${cols}], map: "${idx.name}")`)
  })

  const body = cols.join('\n')
    + (relations.length ? `\n\n${relations.join('\n')}` : '')
    + (indexBlocks.length ? `\n\n${indexBlocks.join('\n')}` : '')

  const uniqueExtras = Array.from(new Set(extraBlocks))

  return templates.prismaSchemaTemplate(table, body) + (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
}

export function generateSchemaDrizzle(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', indexes: Index[] = []) {
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
  const foreignKeyImports = new Set<string>()
  const extras: string[] = []

  const isValidId = /^[a-z_$][\w$]*$/i.test(table)
  const varName = isValidId ? table : toPascalCase(table)

  const cols = columns.map((c) => {
    let typeFunc = getColumnType(c.type, 'drizzle', dialect)
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
      let options = ''
      if (c.maxLength && c.maxLength !== -1 && ['varchar', 'char', 'nvarchar'].includes(typeFunc)) {
        options = `, { length: ${c.maxLength} }`
      }
      else if (typeFunc === 'decimal' && c.precision) {
        options = `, { precision: ${c.precision}${c.scale ? `, scale: ${c.scale}` : ''} }`
      }
      chain = `${typeFunc}('${c.id}'${options})`
    }

    if (!c.isNullable)
      chain += '.notNull()'
    if (c.primaryKey)
      chain += '.primaryKey()'
    if (c.unique && !c.primaryKey)
      chain += '.unique()'

    if (c.foreign && dialect !== 'clickhouse') {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(c.foreign.table)
      const refTable = isValidRef ? c.foreign.table : toPascalCase(c.foreign.table)
      chain += `.references(() => ${refTable}.${c.foreign.column})`

      foreignKeyImports.add(`import { ${refTable} } from './${c.foreign.table}';`)
    }

    return `  ${safeKey}: ${chain},`
  }).join('\n')

  const relationships: string[] = []

  columns.forEach((c) => {
    if (c.foreign && dialect !== 'clickhouse') {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(c.foreign.table)
      const refTable = isValidRef ? c.foreign.table : toPascalCase(c.foreign.table)
      const fieldName = c.id
      relationships.push(`    ${fieldName}: one(${refTable}, {\n      fields: [${varName}.${c.id}],\n      references: [${refTable}.${c.foreign.column}],\n    }),`)
    }

    if (c.references?.length) {
      c.references.forEach((ref) => {
        const isValidRef = /^[a-z_$][\w$]*$/i.test(ref.table)
        const refTable = isValidRef ? ref.table : toPascalCase(ref.table)
        const fieldName = ref.table

        relationships.push(`    ${fieldName}: many(${refTable}),`)

        foreignKeyImports.add(`import { ${refTable} } from './${ref.table}';`)
      })
    }
  })

  const explicitIndexes = groupIndexes(indexes, table).filter(idx => !idx.isPrimary && dialect !== 'clickhouse' && !(idx.isUnique && idx.columns.length === 1 && columns.find(c => c.id === idx.columns[0] && c.unique)))

  let extraConfig = ''
  if (explicitIndexes.length > 0) {
    const idxDecls: string[] = []
    let usedIndex = false
    let usedUnique = false

    explicitIndexes.forEach((idx) => {
      const func = idx.isUnique ? 'uniqueIndex' : 'index'
      if (idx.isUnique)
        usedUnique = true
      else
        usedIndex = true

      const onCols = idx.columns.map((col) => {
        const isSafe = /^[a-z_$][\w$]*$/i.test(col)
        return isSafe ? `t.${col}` : `t['${col}']`
      }).join(', ')

      const keySafe = /^[a-z_$][\w$]*$/i.test(idx.name)
      const objKey = keySafe ? idx.name : `'${idx.name}'`

      idxDecls.push(`    ${objKey}: ${func}('${idx.name}').on(${onCols}),`)
    })

    if (usedIndex)
      imports.add('index')
    if (usedUnique)
      imports.add('uniqueIndex')

    extraConfig = idxDecls.join('\n')
  }

  if (foreignKeyImports.size > 0) {
    extras.push(...Array.from(foreignKeyImports))
  }

  const base = templates.drizzleSchemaTemplate(table, Array.from(imports), cols, tableFunc, importPath, extraConfig)

  if (relationships.length > 0) {
    const relName = `${varName}Relations`
    const relBlock = `export const ${relName} = relations(${varName}, ({ one, many }) => ({\n${relationships.join('\n')}\n}));`
    return `import { relations } from 'drizzle-orm';\n${extras.length ? `${extras.join('\n')}\n\n` : ''}${base}\n\n${relBlock}`
  }

  return (extras.length ? `${extras.join('\n')}\n\n` : '') + base
}

export function generateSchemaKysely(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionDialect = 'postgres', _indexes: Index[] = []) {
  const body = columns.map((c) => {
    let tsType = getColumnType(c.type, 'ts', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      tsType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        tsType = `(${tsType})[]`
    }

    const isGenerated = c.primaryKey
    let typeDef = isGenerated ? `Generated<${tsType}>` : tsType
    if (c.isNullable)
      typeDef += ' | null'
    const safeKey = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    return `  ${safeKey}: ${typeDef};`
  }).join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
