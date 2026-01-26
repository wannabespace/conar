import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { ConnectionDialect, Index } from '../types'
import { findEnum, getColumnType, groupIndexes, toPascalCase } from '../helpers'
import * as templates from '../templates'

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
