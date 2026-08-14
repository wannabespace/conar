import type { ActiveFilter } from '@tamery/shared/filters'
import { camelCase, pascalCase } from 'change-case'

import type { QueryParams, SchemaParams } from '..'
import * as templates from '../templates'
import { filterExplicitIndexes, getColumnType, groupIndexes } from '../utils'

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

const PRISMA_OP_MAP: Record<string, string> = {
  '!=': 'not',
  '<': 'lt',
  '<=': 'lte',
  '=': 'equals',
  '>': 'gt',
  '>=': 'gte',
  ILIKE: 'contains',
  LIKE: 'contains',
}

const singleFilterToPrisma = (
  filter: ActiveFilter
): PrismaFilterValue | null => {
  const op = filter.ref.operator.toUpperCase()
  const [value] = filter.values

  if (filter.ref.isArray) {
    if (op === 'IN') {
      return { in: filter.values.filter(isPrismaFilterValue) }
    }
    if (op === 'NOT IN') {
      return { notIn: filter.values.filter(isPrismaFilterValue) }
    }
    return null
  }
  if (filter.ref.hasValue === false) {
    if (op === 'IS NULL') {
      return null
    }
    if (op === 'IS NOT NULL') {
      return { not: null }
    }
    return null
  }
  if (!isPrismaFilterValue(value)) {
    return null
  }

  const prismaOp = PRISMA_OP_MAP[op]
  if (!prismaOp) {
    return null
  }
  return prismaOp === 'equals' ? value : { [prismaOp]: value }
}

const mergeWhereField = (
  existing: PrismaFilterValue | undefined,
  next: PrismaFilterValue
): PrismaFilterValue => {
  if (
    existing === null ||
    typeof existing !== 'object' ||
    typeof next !== 'object' ||
    next === null
  ) {
    return next
  }
  return { ...existing, ...next }
}

export const generateQueryPrisma = ({ table, filters }: QueryParams) => {
  const tableName = camelCase(table)
  const where: Record<string, PrismaFilterValue> = {}
  for (const f of filters) {
    const finalValue = singleFilterToPrisma(f)
    if (finalValue === null) {
      continue
    }
    const colName = camelCase(f.column)
    where[colName] = mergeWhereField(where[colName], finalValue)
  }

  const jsonWhere =
    Object.keys(where).length > 0
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
  const value = FK_ACTION_MAP[action?.toUpperCase() ?? '']
  return value ? `, ${kind}: ${value}` : ''
}

interface PrismaField {
  name: string
  type: string
  attributes: string[]
  isRelation: boolean
}

const buildFieldAttributes = (
  c: SchemaParams['columns'][number],
  prismaType: string,
  needsMap: boolean
): string[] => {
  const attributes: string[] = []
  if (c.primaryKey) {
    attributes.push('@id')
    if (prismaType === 'Int') {
      attributes.push('@default(autoincrement())')
    }
  } else if (c.unique) {
    attributes.push('@unique')
  }

  if (prismaType === 'String' && c.maxLength && c.maxLength > 0) {
    attributes.push(`@db.VarChar(${c.maxLength})`)
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
  extraBlocks: string[]
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
  extraBlocks.push(`enum ${enumName} {\n${availableValues}\n}`)
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
    const isValidRef = /^[a-z]\w*$/iu.test(ref.table)
    const refType = isValidRef ? ref.table : pascalCase(ref.table)
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
  columns,
  dialect,
  indexes = [],
}: SchemaParams) => {
  const fields: PrismaField[] = []
  const extraBlocks: string[] = []
  const usedNames = new Set<string>()

  for (const c of columns) {
    if (!c.type) {
      continue
    }

    let prismaType = getColumnType(c.type, 'prisma', dialect)
    const enumName = appendEnumBlock(c, extraBlocks)
    if (enumName) {
      prismaType = enumName
    }

    const fieldName = camelCase(c.id)
    const needsMap = fieldName !== c.id
    usedNames.add(fieldName)

    fields.push({
      attributes: buildFieldAttributes(c, prismaType, needsMap),
      isRelation: false,
      name: fieldName,
      type: prismaType + (c.isNullable ? '?' : ''),
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

  const groupedIndexes = groupIndexes(indexes, table)
  const explicitIndexes = filterExplicitIndexes(groupedIndexes, columns)

  const indexBlocks = explicitIndexes
    .filter((idx) => idx.columns.length > 0)
    .map((idx) => {
      const fieldNames = idx.columns.map((col) => camelCase(col))
      const type = idx.isUnique ? '@@unique' : '@@index'
      return `  ${type}([${fieldNames.join(', ')}], map: "${idx.name}")`
    })

  const body =
    cols.join('\n') + (indexBlocks.length ? `\n${indexBlocks.join('\n')}` : '')

  const uniqueExtras = [...new Set(extraBlocks)]

  return (
    templates.prismaSchemaTemplate(table, body) +
    (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
  )
}
