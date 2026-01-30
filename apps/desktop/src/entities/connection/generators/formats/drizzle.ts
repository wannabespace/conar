import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { Index } from '../utils'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { camelCase, pascalCase } from 'change-case'
import * as templates from '../templates'
import { findEnum, getColumnType, groupIndexes, safePascalCase } from '../utils'

export function generateQueryDrizzle({ table, filters }: { table: string, filters: ActiveFilter[] }) {
  const varName = camelCase(safePascalCase(table))

  const conditions = filters.map((f) => {
    const op = f.ref.operator.toUpperCase()
    const col = `${varName}.${camelCase(f.column)}`
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

  return templates.drizzleQueryTemplate(varName, conditions)
}

const dialectConfig: Record<ConnectionType, { tableFunc: string, importPath: string, enumFunc: string }> = {
  postgres: { tableFunc: 'pgTable', importPath: 'drizzle-orm/pg-core', enumFunc: 'pgEnum' },
  mysql: { tableFunc: 'mysqlTable', importPath: 'drizzle-orm/mysql-core', enumFunc: 'mysqlEnum' },
  mssql: { tableFunc: 'mssqlTable', importPath: 'drizzle-orm/mssql-core', enumFunc: '' },
  clickhouse: { tableFunc: 'clickhouseTable', importPath: 'drizzle-orm/clickhouse-core', enumFunc: 'enum' },
}

export function generateSchemaDrizzle({ table, columns, enums = [], dialect = ConnectionType.Postgres, indexes = [] }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType, indexes?: Index[] }) {
  const config = dialectConfig[dialect]
  const { tableFunc, importPath, enumFunc } = config

  const imports = new Set<string>()
  const foreignKeyImports = new Set<string>()
  const extras: string[] = []

  const varName = camelCase(safePascalCase(table))

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

    const key = camelCase(c.id)
    const safeKey = /^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`

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
      const refTable = isValidRef ? c.foreign.table : pascalCase(c.foreign.table)
      chain += `.references(() => ${refTable}.${camelCase(c.foreign.column)})`

      foreignKeyImports.add(`import { ${refTable} } from './${c.foreign.table}';`)
    }

    return `  ${safeKey}: ${chain},`
  }).join('\n')

  const relationships: string[] = []

  columns.forEach((c) => {
    if (c.foreign && dialect !== 'clickhouse') {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(c.foreign.table)
      const refTable = isValidRef ? c.foreign.table : pascalCase(c.foreign.table)
      const fieldName = camelCase(c.id.replace(/(_id|Id)$/, ''))
      relationships.push(`  ${fieldName}: one(${refTable}, {\n    fields: [${varName}.${camelCase(c.id)}],\n    references: [${refTable}.${camelCase(c.foreign.column)}],\n  }),`)
    }

    if (c.references?.length) {
      c.references.forEach((ref) => {
        const isValidRef = /^[a-z_$][\w$]*$/i.test(ref.table)
        const refTable = isValidRef ? ref.table : pascalCase(ref.table)
        const fieldName = camelCase(ref.table)

        relationships.push(`  ${fieldName}: many(${refTable}),`)

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
        const key = camelCase(col)
        const isSafe = /^[a-z_$][\w$]*$/i.test(key)
        return isSafe ? `t.${key}` : `t['${key}']`
      }).join(', ')

      idxDecls.push(`  ${func}('${idx.name}').on(${onCols}),`)
    })

    if (usedIndex)
      imports.add('index')
    if (usedUnique)
      imports.add('uniqueIndex')

    extraConfig = idxDecls.join('\n')
  }

  const base = templates.drizzleSchemaTemplate(table, Array.from(imports), cols, tableFunc, importPath, extraConfig)

  const splitIdx = base.indexOf('\n\nexport')
  const baseImports = splitIdx !== -1 ? base.slice(0, splitIdx) : ''
  const baseBody = splitIdx !== -1 ? base.slice(splitIdx).trim() : base

  const allImports = [
    relationships.length > 0 ? 'import { relations } from \'drizzle-orm\';' : null,
    ...foreignKeyImports,
    baseImports,
  ].filter(Boolean).join('\n')

  const definitions = [
    extras.join('\n\n'),
    baseBody,
  ]

  if (relationships.length > 0) {
    const relName = `${varName}Relations`
    definitions.push(`export const ${relName} = relations(${varName}, ({ one, many }) => ({\n${relationships.join('\n')}\n}));`)
  }

  return `${allImports}\n\n${definitions.filter(Boolean).join('\n\n')}`
}
