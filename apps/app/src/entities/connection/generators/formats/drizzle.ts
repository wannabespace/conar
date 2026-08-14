import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { camelCase, pascalCase } from 'change-case'

import type { QueryParams, SchemaParams } from '..'
import * as templates from '../templates'
import {
  filterExplicitIndexes,
  getColumnType,
  groupIndexes,
  isValidIdentifier,
  toLiteralKey,
} from '../utils'

const dialectConfig: Record<
  ConnectionType,
  { tableFunc: string; dialectImportPath: string; enumFunc?: string }
> = {
  clickhouse: {
    dialectImportPath: 'drizzle-orm/clickhouse-core',
    enumFunc: 'enum',
    tableFunc: 'clickhouseTable',
  },
  mssql: {
    dialectImportPath: 'drizzle-orm/mssql-core',
    tableFunc: 'mssqlTable',
  },
  mysql: {
    dialectImportPath: 'drizzle-orm/mysql-core',
    enumFunc: 'mysqlEnum',
    tableFunc: 'mysqlTable',
  },
  postgres: {
    dialectImportPath: 'drizzle-orm/pg-core',
    enumFunc: 'pgEnum',
    tableFunc: 'pgTable',
  },
}

const FK_SUFFIX_RE = /(?<suffix>_id|Id)$/u

const resolveRefTable = (table: string): string =>
  isValidIdentifier(table) ? table : pascalCase(table)

const filterOpToDrizzle = (
  op: string,
  col: string,
  val: string,
  arrVal: string
): string | undefined => {
  switch (op) {
    case '=': {
      return `eq(${col}, ${val})`
    }
    case '!=': {
      return `ne(${col}, ${val})`
    }
    case '>': {
      return `gt(${col}, ${val})`
    }
    case '>=': {
      return `gte(${col}, ${val})`
    }
    case '<': {
      return `lt(${col}, ${val})`
    }
    case '<=': {
      return `lte(${col}, ${val})`
    }
    case 'IS NULL': {
      return `isNull(${col})`
    }
    case 'IS NOT NULL': {
      return `isNotNull(${col})`
    }
    case 'IN': {
      return `inArray(${col}, ${arrVal})`
    }
    case 'NOT IN': {
      return `notInArray(${col}, ${arrVal})`
    }
    case 'LIKE': {
      return `like(${col}, ${val})`
    }
    case 'ILIKE': {
      return `ilike(${col}, ${val})`
    }
    default: {
      return undefined
    }
  }
}

export const generateQueryDrizzle = ({ table, filters }: QueryParams) => {
  const varName = camelCase(table)

  const conditions = filters
    .map((f) => {
      const op = f.ref.operator.toUpperCase()
      const col = `${varName}.${camelCase(f.column)}`
      const val = JSON.stringify(f.values[0])
      const arrVal = JSON.stringify(f.values)
      return filterOpToDrizzle(op, col, val, arrVal)
    })
    .filter(Boolean)
    .join(',\n    ')

  return templates.drizzleQueryTemplate(varName, conditions)
}

const buildColumnOptions = (
  c: SchemaParams['columns'][number],
  typeFunc: string,
  isEnum: boolean | string | undefined
): string => {
  if (isEnum) {
    return ''
  }
  if (
    c.maxLength &&
    c.maxLength !== -1 &&
    ['varchar', 'char', 'nvarchar'].includes(typeFunc)
  ) {
    return `, { length: ${c.maxLength} }`
  }
  if (typeFunc === 'decimal' && c.precision) {
    return `, { precision: ${c.precision}${c.scale ? `, scale: ${c.scale}` : ''} }`
  }
  return ''
}

const buildColumnChain = (
  c: SchemaParams['columns'][number],
  typeFunc: string,
  options: string,
  dialect: ConnectionType,
  foreignKeyImports: Set<string>
): string => {
  const key = camelCase(c.id)
  const sameCase = key === c.id

  let chain = sameCase
    ? `${typeFunc}(${options ? options.slice(2).trim() : ''})`
    : `${typeFunc}('${c.id}'${options})`

  if (!c.isNullable) {
    chain += '.notNull()'
  }
  if (c.primaryKey) {
    chain += '.primaryKey()'
  }
  if (c.unique && !c.primaryKey) {
    chain += '.unique()'
  }

  if (c.foreign && dialect !== 'clickhouse') {
    const refTable = resolveRefTable(c.foreign.table)
    const fkOptions = []
    if (c.foreign.onDelete) {
      fkOptions.push(`onDelete: '${c.foreign.onDelete.toLowerCase()}'`)
    }
    if (c.foreign.onUpdate) {
      fkOptions.push(`onUpdate: '${c.foreign.onUpdate.toLowerCase()}'`)
    }

    const optionStr = fkOptions.length ? `, { ${fkOptions.join(', ')} }` : ''
    chain += `.references(() => ${refTable}.${camelCase(c.foreign.column)}${optionStr})`

    foreignKeyImports.add(`import { ${refTable} } from './${c.foreign.table}';`)
  }

  return chain
}

const buildRelationships = (
  columns: SchemaParams['columns'],
  dialect: ConnectionType,
  varName: string
) => {
  const relationships: string[] = []
  const relationshipFkImports = new Set<string>()
  const usedNames = new Set<string>()

  for (const c of columns) {
    if (c.foreign && dialect !== 'clickhouse') {
      const refTable = resolveRefTable(c.foreign.table)
      const fieldName = camelCase(c.id.replace(FK_SUFFIX_RE, ''))
      usedNames.add(fieldName)
      relationships.push(
        `  ${fieldName}: one(${refTable}, {\n    fields: [${varName}.${camelCase(c.id)}],\n    references: [${refTable}.${camelCase(c.foreign.column)}],\n  }),`
      )
    }

    for (const ref of c.references ?? []) {
      const refTable = resolveRefTable(ref.table)
      let fieldName = camelCase(ref.table)
      if (usedNames.has(fieldName)) {
        fieldName = camelCase(`${ref.table}_${ref.column}`)
      }
      usedNames.add(fieldName)
      const rel = ref.isUnique
        ? `  ${fieldName}: one(${refTable}),`
        : `  ${fieldName}: many(${refTable}),`
      relationships.push(rel)
      relationshipFkImports.add(`import { ${refTable} } from './${ref.table}';`)
    }
  }

  return { relationshipFkImports, relationships }
}

export const generateSchemaDrizzle = ({
  table,
  columns,
  dialect,
  indexes = [],
}: SchemaParams) => {
  const { tableFunc, dialectImportPath, enumFunc } = dialectConfig[dialect]

  const coreImports = new Set<string>()
  const dialectImports = new Set<string>()
  const foreignKeyImports = new Set<string>()
  const extras: string[] = []

  const varName = camelCase(table)

  const cols = columns
    .filter((c) => c.type)
    .map((c) => {
      const columnType = c.type
      if (!columnType) {
        return ''
      }
      let typeFunc = getColumnType(columnType, 'drizzle', dialect)

      dialectImports.add(typeFunc)

      const isEnum = !!(enumFunc && c.enumName && c.availableValues?.length)
      if (isEnum && enumFunc) {
        const eName = c.enumName || `${table}_${c.id}`
        const enumTypeName = `${camelCase(eName)}Enum`
        const valuesList = (c.availableValues ?? [])
          .map((v) => `'${v}'`)
          .join(', ')

        dialectImports.add(enumFunc)
        extras.push(
          `export const ${enumTypeName} = ${enumFunc}('${eName}', [${valuesList}]);`
        )

        typeFunc = enumTypeName
      }

      const safeKey = toLiteralKey(camelCase(c.id))
      const options = buildColumnOptions(c, typeFunc, isEnum)
      const chain = buildColumnChain(
        c,
        typeFunc,
        options,
        dialect,
        foreignKeyImports
      )

      return `  ${safeKey}: ${chain},`
    })
    .filter(Boolean)
    .join('\n')

  const { relationships, relationshipFkImports } = buildRelationships(
    columns,
    dialect,
    varName
  )

  const allFkImports = new Set([...foreignKeyImports, ...relationshipFkImports])

  const groupedIndexes = groupIndexes(indexes, table)
  const explicitIndexes = filterExplicitIndexes(
    groupedIndexes,
    columns,
    dialect
  )

  if (relationships.length > 0) {
    coreImports.add('relations')
  }

  if (explicitIndexes.some((idx) => idx.customExpressions.length > 0)) {
    coreImports.add('sql')
  }

  let extraConfig = ''
  if (explicitIndexes.length > 0) {
    const idxDecls = explicitIndexes.map((idx) => {
      const func = idx.isUnique ? 'uniqueIndex' : 'index'
      if (idx.isUnique) {
        dialectImports.add('uniqueIndex')
      } else {
        dialectImports.add('index')
      }

      const onCols = idx.columns.map((col) => {
        const key = camelCase(col)
        return isValidIdentifier(key) ? `t.${key}` : `t['${key}']`
      })
      return `  ${func}('${idx.name}').on(${[...onCols, ...idx.customExpressions.map((c) => `sql\`${c}\``)].join(', ')}),`
    })
    extraConfig = idxDecls.join('\n')
  }

  const base = templates.drizzleSchemaTemplate({
    columns: cols,
    coreImports: [...coreImports],
    dialectImportPath,
    dialectImports: [...dialectImports],
    extraConfig,
    table,
    tableFunc,
  })

  const exportStart = base.indexOf('\n\nexport')
  const baseImports = exportStart === -1 ? '' : base.slice(0, exportStart)
  const baseBody = exportStart === -1 ? base : base.slice(exportStart).trim()

  const allImports = [...allFkImports, baseImports].filter(Boolean).join('\n')

  const definitions = [extras.join('\n\n'), baseBody]

  if (relationships.length > 0) {
    const relName = `${varName}Relations`
    definitions.push(
      `export const ${relName} = relations(${varName}, ({ one, many }) => ({\n${relationships.join('\n')}\n}));`
    )
  }

  return `${allImports}\n\n${definitions.filter(Boolean).join('\n\n')}`
}
