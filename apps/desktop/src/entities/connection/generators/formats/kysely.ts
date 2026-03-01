import type { QueryParams, SchemaParams } from '..'
import { findEnum } from '~/entities/connection/queries/enums'
import * as templates from '../templates'
import { formatValue, getColumnType } from '../utils'

export function generateQueryKysely({
  table,
  filters,
}: QueryParams) {
  const conditions = filters.map((f) => {
    const col = f.column
    if (f.ref.hasValue === false) {
      return `'${col}', '${f.ref.operator.toLowerCase()}'`
    }
    if (f.ref.isArray) {
      const method = f.ref.operator.toUpperCase() === 'IN' ? 'in' : 'not in'
      return `'${col}', '${method}', ${JSON.stringify(f.values)}`
    }
    return `'${col}', '${f.ref.operator}', ${formatValue(f.values[0])}`
  }).filter(Boolean).join(')\n  .where(')

  return templates.kyselyQueryTemplate(table, conditions)
}

export function generateSchemaKysely({
  table,
  columns,
  dialect,
  enums = [],
}: SchemaParams) {
  const body = columns.map((c) => {
    let tsType = getColumnType(c.type, 'ts', dialect)
    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      tsType = foundEnum.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        tsType = `(${tsType})[]`
    }

    const isGenerated = c.primaryKey
    let typeDef = isGenerated ? `Generated<${tsType}>` : tsType
    if (c.isNullable)
      typeDef += ' | null'
    const safeKey = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    return `  ${safeKey}: ${typeDef};`
  }).join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
