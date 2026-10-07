import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { FilterOperator } from '@tamery/shared/filters'
import { camelCase } from 'change-case'

import * as templates from '~/core/codegen/templates'
import type { QueryParams, SchemaParams } from '~/core/codegen/types'
import {
  filterExplicitIndexes,
  getColumnType,
  groupIndexes,
  isNowDefault,
  explicitSchema,
  isSerialDefault,
  isSingleColumnConstraint,
  isValidIdentifier,
  toLiteralKey,
  toStringLiteral,
} from '~/core/codegen/utils'

const dialectConfig: Record<
  Exclude<ConnectionType, ConnectionType.ClickHouse>,
  {
    anyColumn: string
    schemaFunc: string
    tableFunc: string
    dialectImportPath: string
    enumFunc?: string
  }
> = {
  mssql: {
    anyColumn: 'AnyMsSqlColumn',
    dialectImportPath: 'drizzle-orm/mssql-core',
    schemaFunc: 'mssqlSchema',
    tableFunc: 'mssqlTable',
  },
  mysql: {
    anyColumn: 'AnyMySqlColumn',
    dialectImportPath: 'drizzle-orm/mysql-core',
    enumFunc: 'mysqlEnum',
    schemaFunc: 'mysqlSchema',
    tableFunc: 'mysqlTable',
  },
  postgres: {
    anyColumn: 'AnyPgColumn',
    dialectImportPath: 'drizzle-orm/pg-core',
    enumFunc: 'pgEnum',
    schemaFunc: 'pgSchema',
    tableFunc: 'pgTable',
  },
}

const FK_SUFFIX_RE = /(?<suffix>_id|Id)$/u

const SERIAL_BY_INT_TYPE: Record<string, string> = {
  bigint: 'bigserial',
  integer: 'serial',
  smallint: 'smallserial',
}

const resolveRefTable = (table: string): string => camelCase(table)

const DRIZZLE_FUNCTIONS: Record<FilterOperator, string> = {
  eq: 'eq',
  gt: 'gt',
  gte: 'gte',
  ilike: 'ilike',
  in: 'inArray',
  isNotNull: 'isNotNull',
  isNull: 'isNull',
  like: 'like',
  lt: 'lt',
  lte: 'lte',
  ne: 'ne',
  notIn: 'notInArray',
  notLike: 'notLike',
}

export const generateQueryDrizzle = ({ table, filters }: QueryParams) => {
  const varName = camelCase(table)

  const conditions = filters
    .map((f) => {
      const fn = DRIZZLE_FUNCTIONS[f.ref.operator]
      const col = `${varName}.${camelCase(f.column)}`
      if (f.ref.hasValue === false) {
        return `${fn}(${col})`
      }
      const value = f.ref.isArray ? f.values : f.values[0]
      return `${fn}(${col}, ${JSON.stringify(value)})`
    })
    .join(',\n    ')

  return templates.drizzleQueryTemplate(varName, conditions)
}

const buildColumnOptions = (
  c: SchemaParams['columns'][number],
  typeFunc: string
): string => {
  if (
    c.maxLength &&
    c.maxLength !== -1 &&
    ['varchar', 'char', 'nvarchar'].includes(typeFunc)
  ) {
    return `, { length: ${c.maxLength} }`
  }
  if (['bigint', 'bigserial'].includes(typeFunc)) {
    return ", { mode: 'number' }"
  }
  if (
    typeFunc === 'timestamp' &&
    /with time zone|timestamptz/iu.test(c.type ?? '')
  ) {
    return ', { withTimezone: true }'
  }
  if (['decimal', 'numeric'].includes(typeFunc) && c.precision) {
    return `, { precision: ${c.precision}${c.scale ? `, scale: ${c.scale}` : ''} }`
  }
  return ''
}

const buildGeneratedChain = (
  c: SchemaParams['columns'][number],
  dialect: ConnectionType,
  coreImports: Set<string>
): string => {
  if (c.isIdentity && dialect === ConnectionType.Postgres) {
    return '.generatedByDefaultAsIdentity()'
  }
  if (c.isIdentity && dialect === ConnectionType.MSSQL) {
    return '.identity()'
  }
  if (typeof c.defaultValue !== 'string' || isSerialDefault(c.defaultValue)) {
    return ''
  }
  if (isNowDefault(c.defaultValue)) {
    return '.defaultNow()'
  }
  coreImports.add('sql')
  return `.default(sql\`${c.defaultValue}\`)`
}

const buildColumnChain = (
  c: SchemaParams['columns'][number],
  typeFunc: string,
  options: string,
  { columns, dialect }: Pick<SchemaParams, 'columns' | 'dialect'>,
  selfReferenceType: string | null,
  foreignKeyImports: Set<string>,
  coreImports: Set<string>
): string => {
  const key = camelCase(c.id)
  const sameCase = key === c.id

  let chain = sameCase
    ? `${typeFunc}(${options ? options.slice(2).trim() : ''})`
    : `${typeFunc}(${toStringLiteral(c.id)}${options})`

  if (c.isArray && dialect === ConnectionType.Postgres) {
    chain += '.array()'
  }
  chain += buildGeneratedChain(c, dialect, coreImports)
  if (!c.isNullable) {
    chain += '.notNull()'
  }
  if (isSingleColumnConstraint(c, columns, 'primaryKey')) {
    chain += '.primaryKey()'
  }
  if (isSingleColumnConstraint(c, columns, 'unique') && !c.primaryKey) {
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
    const returnType = selfReferenceType ? `: ${selfReferenceType}` : ''
    chain += `.references(()${returnType} => ${refTable}.${camelCase(c.foreign.column)}${optionStr})`

    foreignKeyImports.add(`import { ${refTable} } from './${c.foreign.table}';`)
  }

  return chain
}

const tableColumn = (column: string) => {
  const key = camelCase(column)
  return isValidIdentifier(key) ? `t.${key}` : `t[${toStringLiteral(key)}]`
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
  schema,
  columns,
  dialect,
  indexes = [],
}: SchemaParams) => {
  if (dialect === ConnectionType.ClickHouse) {
    return ''
  }
  const { anyColumn, dialectImportPath, enumFunc, schemaFunc } =
    dialectConfig[dialect]
  let { tableFunc } = dialectConfig[dialect]

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
      if (
        dialect === ConnectionType.Postgres &&
        isSerialDefault(c.defaultValue)
      ) {
        typeFunc = SERIAL_BY_INT_TYPE[typeFunc] ?? 'serial'
      }

      let options = ''
      if (enumFunc && c.enumName && c.availableValues?.length) {
        const values = `[${c.availableValues.map(toStringLiteral).join(', ')}]`
        dialectImports.add(enumFunc)
        if (dialect === ConnectionType.MySQL) {
          typeFunc = enumFunc
          options = `, ${values}`
        } else {
          typeFunc = `${camelCase(c.enumName)}Enum`
          extras.push(
            `export const ${typeFunc} = ${enumFunc}(${toStringLiteral(c.enumName)}, ${values});`
          )
        }
      } else {
        dialectImports.add(typeFunc)
        options = buildColumnOptions(c, typeFunc)
      }

      const isSelfReference = c.foreign?.table === table
      if (isSelfReference) {
        dialectImports.add(anyColumn)
      }

      const safeKey = toLiteralKey(camelCase(c.id))
      const chain = buildColumnChain(
        c,
        typeFunc,
        options,
        { columns, dialect },
        isSelfReference ? anyColumn : null,
        foreignKeyImports,
        coreImports
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
  allFkImports.delete(`import { ${varName} } from './${table}';`)

  const explicitIndexes = filterExplicitIndexes(
    groupIndexes(indexes, schema, table),
    columns
  )

  if (relationships.length > 0) {
    coreImports.add('relations')
  }

  const config: string[] = []
  const primaryColumns = columns.filter((c) => c.primaryKey)
  if (primaryColumns.length > 1) {
    dialectImports.add('primaryKey')
    config.push(
      `  primaryKey({ columns: [${primaryColumns.map((c) => tableColumn(c.id)).join(', ')}] }),`
    )
  }
  for (const idx of explicitIndexes) {
    const func = idx.isUnique ? 'uniqueIndex' : 'index'
    dialectImports.add(func)
    const on = idx.keys.map((key) => {
      if ('column' in key) {
        return tableColumn(key.column)
      }
      coreImports.add('sql')
      return `sql\`${key.expression}\``
    })
    config.push(`  ${func}(${toStringLiteral(idx.name)}).on(${on.join(', ')}),`)
  }

  const tableSchema = explicitSchema(schema, dialect)
  if (tableSchema) {
    const schemaVar = `${camelCase(tableSchema)}Schema`
    dialectImports.add(schemaFunc)
    extras.unshift(
      `export const ${schemaVar} = ${schemaFunc}(${toStringLiteral(tableSchema)});`
    )
    tableFunc = `${schemaVar}.table`
  } else {
    dialectImports.add(tableFunc)
  }

  const base = templates.drizzleSchemaTemplate({
    columns: cols,
    coreImports: [...coreImports],
    dialectImportPath,
    dialectImports: [...dialectImports],
    extraConfig: config.join('\n'),
    table,
    tableFunc,
  })

  const exportStart = base.indexOf('\n\nexport')
  const baseImports = exportStart === -1 ? '' : base.slice(0, exportStart)
  const baseBody = exportStart === -1 ? base : base.slice(exportStart).trim()

  const allImports = [...allFkImports, baseImports].filter(Boolean).join('\n')

  const definitions = [[...new Set(extras)].join('\n\n'), baseBody]

  if (relationships.length > 0) {
    const relName = `${varName}Relations`
    definitions.push(
      `export const ${relName} = relations(${varName}, ({ one, many }) => ({\n${relationships.join('\n')}\n}));`
    )
  }

  return `${allImports}\n\n${definitions.filter(Boolean).join('\n\n')}`
}
