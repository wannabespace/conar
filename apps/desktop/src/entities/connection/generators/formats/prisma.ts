import type { QueryParams, SchemaParams } from '..'
import { camelCase, pascalCase } from 'change-case'
import { findEnum } from '../../sql/enums'
import * as templates from '../templates'
import { getColumnType, groupIndexes, safePascalCase, sanitize } from '../utils'

export type PrismaFilterValue = string | number | boolean | Date | null | { [key: string]: PrismaFilterValue } | PrismaFilterValue[]

export function isPrismaFilterValue(v: unknown): v is PrismaFilterValue {
  return v !== undefined && typeof v !== 'symbol' && typeof v !== 'function'
}

export function generateQueryPrisma({
  table,
  filters,
}: QueryParams) {
  const tableName = camelCase(safePascalCase(table))

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

    const colName = camelCase(f.column)

    const existing = acc[colName]
    return { ...acc, [colName]: existing && typeof existing === 'object' && typeof finalValue === 'object' && finalValue !== null && existing !== null ? { ...existing, ...finalValue } : finalValue }
  }, {})

  const jsonWhere = Object.keys(where).length > 0
    ? JSON.stringify(where, null, 2).replace(/"([^"]+)":/g, '$1:')
    : '{}'

  return templates.prismaQueryTemplate(tableName, jsonWhere)
}

export function generateSchemaPrisma({
  table,
  columns,
  dialect,
  enums = [],
  indexes = [],
}: SchemaParams) {
  const extraBlocks: string[] = []
  const relations: string[] = []
  const fields: { name: string, type: string, attributes: string[], isRelation: boolean }[] = []
  const usedNames = new Set<string>()

  columns.forEach((c) => {
    let prismaType = getColumnType(c.type, 'prisma', dialect) || 'any'

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      const enumName = pascalCase(foundEnum.name || `${table}_${c.id}`)
      prismaType = enumName

      const enumValues = foundEnum.values.map((v) => {
        if (/^[a-z]\w*$/i.test(v))
          return `  ${v}`
        return `  ${sanitize(v)} @map("${v}")`
      }).join('\n')

      extraBlocks.push(`enum ${enumName} {\n${enumValues}\n}`)
    }

    const fieldName = camelCase(safePascalCase(c.id))
    const needsMap = fieldName !== c.id
    usedNames.add(fieldName)

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

    fields.push({
      name: fieldName,
      type: prismaType + (c.isNullable ? '?' : ''),
      attributes,
      isRelation: false,
    })

    if (c.foreign) {
      let relName = camelCase(c.foreign.table)
      if (usedNames.has(relName)) {
        relName = camelCase(`${c.foreign.table}_${c.foreign.column}`)
      }
      usedNames.add(relName)

      const relType = pascalCase(c.foreign.table)

      let onDelete = ''
      if (c.foreign.onDelete) {
        switch (c.foreign.onDelete.toUpperCase()) {
          case 'CASCADE':
            onDelete = ', onDelete: Cascade'
            break
          case 'SET NULL':
            onDelete = ', onDelete: SetNull'
            break
          case 'SET DEFAULT':
            onDelete = ', onDelete: SetDefault'
            break
          case 'RESTRICT':
            onDelete = ', onDelete: Restrict'
            break
          case 'NO ACTION':
            onDelete = ', onDelete: NoAction'
            break
        }
      }

      let onUpdate = ''
      if (c.foreign.onUpdate) {
        switch (c.foreign.onUpdate.toUpperCase()) {
          case 'CASCADE':
            onUpdate = ', onUpdate: Cascade'
            break
          case 'SET NULL':
            onUpdate = ', onUpdate: SetNull'
            break
          case 'SET DEFAULT':
            onUpdate = ', onUpdate: SetDefault'
            break
          case 'RESTRICT':
            onUpdate = ', onUpdate: Restrict'
            break
          case 'NO ACTION':
            onUpdate = ', onUpdate: NoAction'
            break
        }
      }

      fields.push({
        name: relName,
        type: relType,
        attributes: [`@relation(fields: [${fieldName}], references: [${camelCase(c.foreign.column)}]${onDelete}${onUpdate})`],
        isRelation: true,
      })
    }

    if (c.references?.length) {
      c.references.forEach((ref) => {
        const isValidRef = /^[a-z]\w*$/i.test(ref.table)
        const refType = isValidRef ? ref.table : pascalCase(ref.table)
        let fieldName = camelCase(ref.table)
        if (usedNames.has(fieldName)) {
          fieldName = camelCase(`${ref.table}_${ref.column}`)
        }
        usedNames.add(fieldName)

        const isOneToOne = ref.isUnique

        fields.push({
          name: fieldName,
          type: isOneToOne ? `${refType}?` : `${refType}[]`,
          attributes: [],
          isRelation: true,
        })
      })
    }
  })

  const columnFields = fields.filter(f => !f.isRelation)
  const relationFields = fields.filter(f => f.isRelation)

  const allFields = [...columnFields, ...relationFields]

  const maxNameLen = Math.max(...allFields.map(f => f.name.length))
  const maxTypeLen = Math.max(...allFields.map(f => f.type.length))

  const cols = allFields.map((f) => {
    const parts = [
      f.name.padEnd(maxNameLen),
      f.type.padEnd(maxTypeLen),
      ...f.attributes,
    ]
    return `  ${parts.join(' ').trimEnd()}`
  })

  const explicitIndexes = groupIndexes(indexes, table).filter(idx => !idx.isPrimary && !(idx.isUnique && idx.columns.length === 1 && columns.find(c => c.id === idx.columns[0] && c.unique)))

  const indexBlocks: string[] = []
  explicitIndexes.forEach((idx) => {
    const fieldNames = idx.columns.map((col) => {
      const c = columns.find(c => c.id === col)
      if (!c)
        return col
      return camelCase(c.id)
    })

    const type = idx.isUnique ? '@@unique' : '@@index'
    const cols = fieldNames.join(', ')

    indexBlocks.push(`  ${type}([${cols}], map: "${idx.name}")`)
  })

  const body = cols.join('\n')
    + (relations.length ? `\n${relations.join('\n')}` : '')
    + (indexBlocks.length ? `\n${indexBlocks.join('\n')}` : '')

  const uniqueExtras = Array.from(new Set(extraBlocks))

  return templates.prismaSchemaTemplate(table, body) + (uniqueExtras.length ? `\n\n${uniqueExtras.join('\n\n')}` : '')
}
