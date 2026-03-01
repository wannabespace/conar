import type { ActiveFilter } from '@conar/shared/filters'
import type { QueryParams, SchemaParams } from '..'
import { camelCase, pascalCase } from 'change-case'
import { findEnum } from '~/entities/connection/queries/enums'
import * as templates from '../templates'
import { filterExplicitIndexes, getColumnType, groupIndexes } from '../utils'

export type PrismaFilterValue = string | number | boolean | Date | null | { [key: string]: PrismaFilterValue } | PrismaFilterValue[]

export function isPrismaFilterValue(v: unknown): v is PrismaFilterValue {
  return v !== undefined && typeof v !== 'symbol' && typeof v !== 'function'
}

const PRISMA_OP_MAP: Record<string, string> = {
  '=': 'equals',
  '!=': 'not',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  'LIKE': 'contains',
  'ILIKE': 'contains',
}

function singleFilterToPrisma(filter: ActiveFilter): PrismaFilterValue | null {
  const op = filter.ref.operator.toUpperCase()
  const value = filter.values[0]

  if (filter.ref.isArray) {
    if (op === 'IN')
      return { in: filter.values.filter(isPrismaFilterValue) }
    if (op === 'NOT IN')
      return { notIn: filter.values.filter(isPrismaFilterValue) }
    return null
  }
  if (filter.ref.hasValue === false) {
    if (op === 'IS NULL')
      return null
    if (op === 'IS NOT NULL')
      return { not: null }
    return null
  }
  if (!isPrismaFilterValue(value))
    return null

  const prismaOp = PRISMA_OP_MAP[op]
  if (!prismaOp)
    return null
  return prismaOp === 'equals' ? value : { [prismaOp]: value }
}

function mergeWhereField(
  existing: PrismaFilterValue | undefined,
  next: PrismaFilterValue,
): PrismaFilterValue {
  if (existing == null || typeof existing !== 'object' || typeof next !== 'object' || next === null) {
    return next
  }
  return { ...existing, ...next }
}

export function generateQueryPrisma({ table, filters }: QueryParams) {
  const tableName = camelCase(table)
  const where = filters.reduce<Record<string, PrismaFilterValue>>((acc, f) => {
    const finalValue = singleFilterToPrisma(f)
    if (finalValue === null)
      return acc
    const colName = camelCase(f.column)
    acc[colName] = mergeWhereField(acc[colName], finalValue)
    return acc
  }, {})

  const jsonWhere = Object.keys(where).length > 0
    ? JSON.stringify(where, null, 2).replace(/"([^"]+)":/g, '$1:')
    : '{}'

  return templates.prismaQueryTemplate(tableName, jsonWhere)
}

function foreignActionToPrisma(action: string, kind: 'onDelete' | 'onUpdate'): string {
  const key = kind === 'onDelete' ? 'onDelete' : 'onUpdate'
  const map: Record<string, string> = {
    'CASCADE': 'Cascade',
    'SET NULL': 'SetNull',
    'SET DEFAULT': 'SetDefault',
    'RESTRICT': 'Restrict',
    'NO ACTION': 'NoAction',
  }
  const value = map[action?.toUpperCase() ?? '']
  return value ? `, ${key}: ${value}` : ''
}

export function generateSchemaPrisma({
  table,
  columns,
  dialect,
  enums = [],
  indexes = [],
}: SchemaParams) {
  const { fields, extraBlocks } = columns.reduce<{
    fields: { name: string, type: string, attributes: string[], isRelation: boolean }[]
    extraBlocks: string[]
    usedNames: Set<string>
  }>((acc, c) => {
    let prismaType = getColumnType(c.type, 'prisma', dialect)

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      const enumName = pascalCase(foundEnum.name || `${table}_${c.id}`)
      prismaType = enumName

      const enumValues = foundEnum.values.map((v) => {
        if (/^[a-z]\w*$/i.test(v))
          return `  ${v}`
        return `  ${v.replace(/\W/g, '_')} @map("${v}")`
      }).join('\n')

      acc.extraBlocks.push(`enum ${enumName} {\n${enumValues}\n}`)
    }

    const fieldName = camelCase(c.id)
    const needsMap = fieldName !== c.id
    acc.usedNames.add(fieldName)

    const attributes: string[] = []
    if (c.primaryKey) {
      attributes.push('@id')
      if (prismaType === 'Int')
        attributes.push('@default(autoincrement())')
    }
    else if (c.unique) {
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

    acc.fields.push({
      name: fieldName,
      type: prismaType + (c.isNullable ? '?' : ''),
      attributes,
      isRelation: false,
    })

    if (c.foreign) {
      let relName = camelCase(c.foreign.table)
      if (acc.usedNames.has(relName))
        relName = camelCase(`${c.foreign.table}_${c.foreign.column}`)
      acc.usedNames.add(relName)

      const relType = pascalCase(c.foreign.table)
      const onDelete = foreignActionToPrisma(c.foreign.onDelete ?? '', 'onDelete')
      const onUpdate = foreignActionToPrisma(c.foreign.onUpdate ?? '', 'onUpdate')

      acc.fields.push({
        name: relName,
        type: relType,
        attributes: [`@relation(fields: [${fieldName}], references: [${camelCase(c.foreign.column)}]${onDelete}${onUpdate})`],
        isRelation: true,
      })
    }

    const refFields = (c.references ?? []).map((ref) => {
      const isValidRef = /^[a-z]\w*$/i.test(ref.table)
      const refType = isValidRef ? ref.table : pascalCase(ref.table)
      let refFieldName = camelCase(ref.table)
      if (acc.usedNames.has(refFieldName))
        refFieldName = camelCase(`${ref.table}_${ref.column}`)
      acc.usedNames.add(refFieldName)
      return {
        name: refFieldName,
        type: ref.isUnique ? `${refType}?` : `${refType}[]`,
        attributes: [] as string[],
        isRelation: true as const,
      }
    })
    acc.fields.push(...refFields)
    return acc
  }, { fields: [], extraBlocks: [], usedNames: new Set<string>() })

  const allFields = [...fields.filter(f => !f.isRelation), ...fields.filter(f => f.isRelation)]
  const maxNameLen = Math.max(...allFields.map(f => f.name.length), 0)
  const maxTypeLen = Math.max(...allFields.map(f => f.type.length), 0)

  const cols = allFields.map((f) => {
    const parts = [f.name.padEnd(maxNameLen), f.type.padEnd(maxTypeLen), ...f.attributes]
    return `  ${parts.join(' ').trimEnd()}`
  })

  const groupedIndexes = groupIndexes(indexes, table)
  const explicitIndexes = filterExplicitIndexes(groupedIndexes, columns)

  const indexBlocks = explicitIndexes.filter(idx => idx.columns.length > 0).map((idx) => {
    const fieldNames = idx.columns.map((col) => {
      const colDef = columns.find(c => c.id === col)
      return colDef ? camelCase(colDef.id) : col
    })
    const type = idx.isUnique ? '@@unique' : '@@index'
    return `  ${type}([${fieldNames.join(', ')}], map: "${idx.name}")`
  })

  const body = cols.join('\n') + (indexBlocks.length ? `\n${indexBlocks.join('\n')}` : '')

  const uniqueExtras = Array.from(new Set(extraBlocks))

  return templates.prismaSchemaTemplate(table, body) + (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
}
