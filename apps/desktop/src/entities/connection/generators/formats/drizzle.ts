import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { QueryParams, SchemaParams } from '..'
import { camelCase, pascalCase } from 'change-case'
import { findEnum } from '../../sql/enums'
import * as templates from '../templates'
import { filterExplicitIndexes, getColumnType, groupIndexes } from '../utils'

export function generateQueryDrizzle({
  table,
  filters,
}: QueryParams) {
  const varName = camelCase(table)

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

const dialectConfig: Record<ConnectionType, { tableFunc: string, dialectImportPath: string, enumFunc?: string }> = {
  postgres: { tableFunc: 'pgTable', dialectImportPath: 'drizzle-orm/pg-core', enumFunc: 'pgEnum' },
  mysql: { tableFunc: 'mysqlTable', dialectImportPath: 'drizzle-orm/mysql-core', enumFunc: 'mysqlEnum' },
  mssql: { tableFunc: 'mssqlTable', dialectImportPath: 'drizzle-orm/mssql-core' },
  clickhouse: { tableFunc: 'clickhouseTable', dialectImportPath: 'drizzle-orm/clickhouse-core', enumFunc: 'enum' },
  redis: { tableFunc: 'pgTable', dialectImportPath: 'drizzle-orm/pg-core', enumFunc: 'pgEnum' },
}

export function generateSchemaDrizzle({
  table,
  columns,
  dialect,
  enums = [],
  indexes = [],
}: SchemaParams) {
  const { tableFunc, dialectImportPath, enumFunc } = dialectConfig[dialect]

  const coreImports = new Set<string>()
  const dialectImports = new Set<string>()
  const foreignKeyImports = new Set<string>()
  const extras: string[] = []

  const varName = camelCase(table)

  const cols = columns.map((c) => {
    let typeFunc = getColumnType(c.type, 'drizzle', dialect)

    dialectImports.add(typeFunc)

    const foundEnum = findEnum(enums, c, table)
    if (enumFunc && foundEnum?.values.length) {
      const eName = foundEnum.name || `${table}_${c.id}`
      const enumTypeName = `${camelCase(eName)}Enum`
      const valuesList = foundEnum.values.map(v => `'${v}'`).join(', ')

      dialectImports.add(enumFunc)
      extras.push(`export const ${enumTypeName} = ${enumFunc}('${eName}', [${valuesList}]);`)

      typeFunc = enumTypeName
    }

    const key = camelCase(c.id)
    const safeKey = /^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`
    const sameCase = key === c.id

    let options = ''
    if (!(enumFunc && foundEnum?.values.length)) {
      if (c.maxLength && c.maxLength !== -1 && ['varchar', 'char', 'nvarchar'].includes(typeFunc)) {
        options = `, { length: ${c.maxLength} }`
      }
      else if (typeFunc === 'decimal' && c.precision) {
        options = `, { precision: ${c.precision}${c.scale ? `, scale: ${c.scale}` : ''} }`
      }
    }

    let chain = sameCase ? `${typeFunc}(${options ? options.slice(2).trim() : ''})` : `${typeFunc}('${c.id}'${options})`

    if (!c.isNullable)
      chain += '.notNull()'
    if (c.primaryKey)
      chain += '.primaryKey()'
    if (c.unique && !c.primaryKey)
      chain += '.unique()'

    if (c.foreign && dialect !== 'clickhouse') {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(c.foreign.table)
      const refTable = isValidRef ? c.foreign.table : pascalCase(c.foreign.table)
      const fkOptions = []
      if (c.foreign.onDelete)
        fkOptions.push(`onDelete: '${c.foreign.onDelete.toLowerCase()}'`)
      if (c.foreign.onUpdate)
        fkOptions.push(`onUpdate: '${c.foreign.onUpdate.toLowerCase()}'`)

      const optionStr = fkOptions.length ? `, { ${fkOptions.join(', ')} }` : ''
      chain += `.references(() => ${refTable}.${camelCase(c.foreign.column)}${optionStr})`

      foreignKeyImports.add(`import { ${refTable} } from './${c.foreign.table}';`)
    }

    return `  ${safeKey}: ${chain},`
  }).join('\n')

  const { relationships, relationshipFkImports } = columns.reduce<{
    relationships: string[]
    usedNames: Set<string>
    relationshipFkImports: Set<string>
  }>((acc, c) => {
    if (c.foreign && dialect !== 'clickhouse') {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(c.foreign.table)
      const refTable = isValidRef ? c.foreign.table : pascalCase(c.foreign.table)
      const fieldName = camelCase(c.id.replace(/(_id|Id)$/, ''))
      acc.usedNames.add(fieldName)
      acc.relationships.push(`  ${fieldName}: one(${refTable}, {\n    fields: [${varName}.${camelCase(c.id)}],\n    references: [${refTable}.${camelCase(c.foreign.column)}],\n  }),`)
    }

    const refEntries = (c.references ?? []).map((ref) => {
      const isValidRef = /^[a-z_$][\w$]*$/i.test(ref.table)
      const refTable = isValidRef ? ref.table : pascalCase(ref.table)
      let fieldName = camelCase(ref.table)
      if (acc.usedNames.has(fieldName)) {
        fieldName = camelCase(`${ref.table}_${ref.column}`)
      }
      acc.usedNames.add(fieldName)
      const rel = ref.isUnique
        ? `  ${fieldName}: one(${refTable}),`
        : `  ${fieldName}: many(${refTable}),`
      const fkImport = `import { ${refTable} } from './${ref.table}';`
      return { rel, fkImport }
    })
    acc.relationships.push(...refEntries.map(e => e.rel))
    refEntries.map(e => e.fkImport).map(imp => acc.relationshipFkImports.add(imp))
    return acc
  }, { relationships: [], usedNames: new Set<string>(), relationshipFkImports: new Set<string>() })

  const allFkImports = new Set([...foreignKeyImports, ...relationshipFkImports])

  const groupedIndexes = groupIndexes(indexes, table)
  const explicitIndexes = filterExplicitIndexes(groupedIndexes, columns, dialect)

  if (relationships.length > 0) {
    coreImports.add('relations')
  }

  if (explicitIndexes.some(idx => idx.customExpressions.length > 0)) {
    coreImports.add('sql')
  }

  let extraConfig = ''
  if (explicitIndexes.length > 0) {
    const idxDecls = explicitIndexes.map((idx) => {
      const func = idx.isUnique ? 'uniqueIndex' : 'index'
      if (idx.isUnique)
        dialectImports.add('uniqueIndex')
      else dialectImports.add('index')

      const onCols = idx.columns.map((col) => {
        const key = camelCase(col)
        const isSafe = /^[a-z_$][\w$]*$/i.test(key)
        return isSafe ? `t.${key}` : `t['${key}']`
      })
      return `  ${func}('${idx.name}').on(${[...onCols, ...idx.customExpressions.map(c => `sql\`${c}\``)].join(', ')}),`
    })
    extraConfig = idxDecls.join('\n')
  }

  const base = templates.drizzleSchemaTemplate({
    table,
    coreImports: Array.from(coreImports),
    dialectImports: Array.from(dialectImports),
    columns: cols,
    tableFunc,
    dialectImportPath,
    extraConfig,
  })

  // Template outputs "import...\n\nexport const ..."; split so we can prepend relation imports.
  const exportStart = base.indexOf('\n\nexport')
  const baseImports = exportStart >= 0 ? base.slice(0, exportStart) : ''
  const baseBody = exportStart >= 0 ? base.slice(exportStart).trim() : base

  const allImports = [
    ...allFkImports,
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
