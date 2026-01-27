import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { Index, PrismaFilterValue } from '../types'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { pascalCase } from 'change-case'
import { findEnum, getColumnType, groupIndexes, isPrismaFilterValue, sanitize } from '../helpers'
import * as templates from '../templates'

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

export function generateSchemaPrisma({ table, columns, enums = [], dialect = ConnectionType.Postgres, indexes = [] }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType, indexes?: Index[] }) {
  const extraBlocks: string[] = []
  const relations: string[] = []

  const cols = columns.map((c) => {
    let prismaType = getColumnType(c.type, 'prisma', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      const enumName = pascalCase(match.name || `${table}_${c.id}`)
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
      const relType = pascalCase(c.foreign.table)
      relations.push(`  ${relName} ${relType} @relation(fields: [${fieldName}], references: [${c.foreign.column}])`)
    }

    if (c.references?.length) {
      c.references.forEach((ref) => {
        const isValidRef = /^[a-z]\w*$/i.test(ref.table)
        const refType = isValidRef ? ref.table : pascalCase(ref.table)
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
