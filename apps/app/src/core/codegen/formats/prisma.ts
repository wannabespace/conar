import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { ActiveFilter, FilterOperator } from '@tamery/shared/filters'
import { camelCase, pascalCase } from 'change-case'

import * as templates from '~/core/codegen/templates'
import type { QueryParams, SchemaParams } from '~/core/codegen/types'
import {
  explicitSchema,
  filterExplicitIndexes,
  getColumnType,
  groupIndexes,
  isNowDefault,
  isSerialDefault,
  isSingleColumnConstraint,
} from '~/core/codegen/utils'

type PrismaFilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | { [key: string]: PrismaFilterValue }
  | PrismaFilterValue[]

const isPrismaFilterValue = (v: unknown): v is PrismaFilterValue =>
  v !== undefined && typeof v !== 'symbol' && typeof v !== 'function'

const PRISMA_OPERATORS: Record<FilterOperator, string | null> = {
  eq: 'equals',
  gt: 'gt',
  gte: 'gte',
  ilike: null,
  in: 'in',
  isNotNull: 'not',
  isNull: 'equals',
  like: null,
  lt: 'lt',
  lte: 'lte',
  ne: 'not',
  notIn: 'notIn',
  notLike: null,
}

const likePatternToPrisma = (pattern: string): Record<string, string> => {
  const leading = pattern.startsWith('%')
  const trailing = pattern.length > 1 && pattern.endsWith('%')
  const text = pattern.slice(leading ? 1 : 0, trailing ? -1 : undefined)
  if (leading && trailing) {
    return { contains: text }
  }
  if (leading) {
    return { endsWith: text }
  }
  return trailing ? { startsWith: text } : { equals: text }
}

const likeFilterToPrisma = ({
  ref,
  values: [pattern],
}: ActiveFilter): PrismaFilterValue => {
  const match = likePatternToPrisma(String(pattern))
  if (ref.operator === 'notLike') {
    return { not: match }
  }
  return ref.operator === 'ilike' ? { ...match, mode: 'insensitive' } : match
}

const singleFilterToPrisma = (
  filter: ActiveFilter
): PrismaFilterValue | null => {
  const prismaOp = PRISMA_OPERATORS[filter.ref.operator]
  if (!prismaOp) {
    return likeFilterToPrisma(filter)
  }
  if (filter.ref.hasValue === false) {
    return { [prismaOp]: null }
  }
  if (filter.ref.isArray) {
    return { [prismaOp]: filter.values.filter(isPrismaFilterValue) }
  }
  const [value] = filter.values
  if (!isPrismaFilterValue(value)) {
    return null
  }
  return prismaOp === 'equals' ? value : { [prismaOp]: value }
}

export const generateQueryPrisma = ({ table, filters }: QueryParams) => {
  const tableName = camelCase(table)
  const conditions = filters.flatMap((f) => {
    const value = singleFilterToPrisma(f)
    return value === null ? [] : [{ [camelCase(f.column)]: value }]
  })
  const fields = conditions.flatMap(Object.keys)
  const where =
    new Set(fields).size === fields.length
      ? Object.assign({}, ...conditions)
      : { AND: conditions }

  const jsonWhere =
    conditions.length > 0
      ? JSON.stringify(where, null, 2).replaceAll(
          /"(?<key>[^"]+)":/gu,
          '$<key>:'
        )
      : '{}'

  return templates.prismaQueryTemplate(tableName, jsonWhere)
}

const FK_ACTION_MAP: Record<string, string> = {
  CASCADE: 'Cascade',
  'NO ACTION': 'NoAction',
  RESTRICT: 'Restrict',
  'SET DEFAULT': 'SetDefault',
  'SET NULL': 'SetNull',
}

const foreignActionToPrisma = (
  action: string,
  kind: 'onDelete' | 'onUpdate'
): string => {
  const value = FK_ACTION_MAP[action.toUpperCase()]
  return value ? `, ${kind}: ${value}` : ''
}

interface PrismaField {
  name: string
  type: string
  attributes: string[]
  isRelation: boolean
}

const prismaDefault = (c: SchemaParams['columns'][number]): string | null => {
  if (c.isIdentity || isSerialDefault(c.defaultValue)) {
    return 'autoincrement()'
  }
  if (typeof c.defaultValue !== 'string') {
    return null
  }
  if (isNowDefault(c.defaultValue)) {
    return 'now()'
  }
  const literal = c.defaultValue.replaceAll(/^\(+|\)+$/gu, '')
  if (
    /^-?\d+(?:\.\d+)?$/u.test(literal) ||
    /^(?:true|false)$/iu.test(literal)
  ) {
    return literal.toLowerCase()
  }
  return `dbgenerated("${c.defaultValue.replaceAll('"', '\\"')}")`
}

const SIZED_STRING_TYPES: Record<string, string> = {
  char: 'Char',
  character: 'Char',
  'character varying': 'VarChar',
  nchar: 'NChar',
  nvarchar: 'NVarChar',
  varchar: 'VarChar',
}

const POSTGRES_NATIVE_TYPES: Record<string, string> = {
  date: '@db.Date',
  'time without time zone': '@db.Time',
  'timestamp with time zone': '@db.Timestamptz',
  uuid: '@db.Uuid',
}

const buildFieldAttributes = (
  c: SchemaParams['columns'][number],
  prismaType: string,
  needsMap: boolean,
  { columns, dialect }: Pick<SchemaParams, 'columns' | 'dialect'>
): string[] => {
  const attributes: string[] = []
  if (isSingleColumnConstraint(c, columns, 'primaryKey')) {
    attributes.push('@id')
  } else if (isSingleColumnConstraint(c, columns, 'unique')) {
    attributes.push('@unique')
  }

  const defaultValue = prismaDefault(c)
  if (defaultValue) {
    attributes.push(`@default(${defaultValue})`)
  }

  const sizedString = SIZED_STRING_TYPES[c.type ?? '']
  if (prismaType === 'String' && sizedString && c.maxLength) {
    attributes.push(
      `@db.${sizedString}(${c.maxLength === -1 ? 'Max' : c.maxLength})`
    )
  }

  const nativeType = POSTGRES_NATIVE_TYPES[c.type ?? '']
  if (dialect === ConnectionType.Postgres && nativeType) {
    attributes.push(nativeType)
  }

  if (prismaType === 'Decimal' && c.precision) {
    attributes.push(`@db.Decimal(${c.precision}, ${c.scale || 0})`)
  }

  if (needsMap) {
    attributes.push(`@map("${c.id}")`)
  }

  return attributes
}

const appendEnumBlock = (
  c: SchemaParams['columns'][number],
  extraBlocks: string[],
  blockAttributes: string[]
): string | null => {
  if (!(c.enumName && c.availableValues?.length)) {
    return null
  }
  const enumName = pascalCase(c.enumName)
  const availableValues = c.availableValues
    .map((v) => {
      if (/^[a-z]\w*$/iu.test(v)) {
        return `  ${v}`
      }
      return `  ${v.replaceAll(/\W/gu, '_')} @map("${v}")`
    })
    .join('\n')
  const attributes = [
    ...(enumName === c.enumName ? [] : [`@@map("${c.enumName}")`]),
    ...blockAttributes,
  ]
  const attributeLines = attributes.length
    ? `\n\n${attributes.map((a) => `  ${a}`).join('\n')}`
    : ''
  extraBlocks.push(`enum ${enumName} {\n${availableValues}${attributeLines}\n}`)
  return enumName
}

const appendForeignAndRefs = (
  c: SchemaParams['columns'][number],
  fieldName: string,
  fields: PrismaField[],
  usedNames: Set<string>
) => {
  if (c.foreign) {
    let relName = camelCase(c.foreign.table)
    if (usedNames.has(relName)) {
      relName = camelCase(`${c.foreign.table}_${c.foreign.column}`)
    }
    usedNames.add(relName)

    const relType = pascalCase(c.foreign.table)
    const onDelete = foreignActionToPrisma(c.foreign.onDelete ?? '', 'onDelete')
    const onUpdate = foreignActionToPrisma(c.foreign.onUpdate ?? '', 'onUpdate')

    fields.push({
      attributes: [
        `@relation(fields: [${fieldName}], references: [${camelCase(c.foreign.column)}]${onDelete}${onUpdate})`,
      ],
      isRelation: true,
      name: relName,
      type: relType,
    })
  }

  for (const ref of c.references ?? []) {
    const refType = pascalCase(ref.table)
    let refFieldName = camelCase(ref.table)
    if (usedNames.has(refFieldName)) {
      refFieldName = camelCase(`${ref.table}_${ref.column}`)
    }
    usedNames.add(refFieldName)
    fields.push({
      attributes: [],
      isRelation: true,
      name: refFieldName,
      type: ref.isUnique ? `${refType}?` : `${refType}[]`,
    })
  }
}

export const generateSchemaPrisma = ({
  table,
  schema,
  columns,
  dialect,
  indexes = [],
}: SchemaParams) => {
  const fields: PrismaField[] = []
  const extraBlocks: string[] = []
  const usedNames = new Set<string>()
  const tableSchema = explicitSchema(schema, dialect)
  const schemaAttributes = tableSchema ? [`@@schema("${tableSchema}")`] : []

  for (const c of columns) {
    if (!c.type) {
      continue
    }

    let prismaType = getColumnType(c.type, 'prisma', dialect)
    const enumName = appendEnumBlock(c, extraBlocks, schemaAttributes)
    if (enumName) {
      prismaType = enumName
    }

    const fieldName = camelCase(c.id)
    const needsMap = fieldName !== c.id
    usedNames.add(fieldName)

    const isList = c.isArray && dialect === ConnectionType.Postgres
    fields.push({
      attributes: buildFieldAttributes(c, prismaType, needsMap, {
        columns,
        dialect,
      }),
      isRelation: false,
      name: fieldName,
      type: isList ? `${prismaType}[]` : prismaType + (c.isNullable ? '?' : ''),
    })

    appendForeignAndRefs(c, fieldName, fields, usedNames)
  }

  const allFields = [
    ...fields.filter((f) => !f.isRelation),
    ...fields.filter((f) => f.isRelation),
  ]
  const maxNameLen = Math.max(...allFields.map((f) => f.name.length), 0)
  const maxTypeLen = Math.max(...allFields.map((f) => f.type.length), 0)

  const cols = allFields.map((f) => {
    const parts = [
      f.name.padEnd(maxNameLen),
      f.type.padEnd(maxTypeLen),
      ...f.attributes,
    ]
    return `  ${parts.join(' ').trimEnd()}`
  })

  const explicitIndexes = filterExplicitIndexes(
    groupIndexes(indexes, schema, table),
    columns
  )

  const primaryFields = columns
    .filter((c) => c.primaryKey)
    .map((c) => camelCase(c.id))
  const indexAttributes = explicitIndexes
    .filter((idx) => idx.keys.every((key) => 'column' in key))
    .map((idx) => {
      const fieldNames = idx.columns.map((col) => camelCase(col))
      const type = idx.isUnique ? '@@unique' : '@@index'
      return `${type}([${fieldNames.join(', ')}], map: "${idx.name}")`
    })
  const modelAttributes = [
    ...(primaryFields.length > 1
      ? [`@@id([${primaryFields.join(', ')}])`]
      : []),
    ...indexAttributes,
    ...schemaAttributes,
  ]

  const uniqueExtras = [...new Set(extraBlocks)]

  return (
    templates.prismaSchemaTemplate(table, cols.join('\n'), modelAttributes) +
    (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
  )
}
