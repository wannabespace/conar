import * as templates from '../templates'
import type { QueryParams, SchemaParams } from '../types'
import { formatEnumAsUnionType, getColumnType, toLiteralKey } from '../utils'

export const generateQueryKysely = ({ table, filters }: QueryParams) => {
  const conditions = filters
    .map((f) => {
      const op = f.ref.operator.toLowerCase()
      if (f.ref.hasValue === false) {
        return `'${f.column}', '${op === 'is null' ? 'is' : 'is not'}', null`
      }
      const value = f.ref.isArray ? f.values : f.values[0]
      return `'${f.column}', '${op}', ${JSON.stringify(value)}`
    })
    .join(')\n  .where(')

  return templates.kyselyQueryTemplate(table, conditions)
}

export const generateSchemaKysely = ({
  table,
  columns,
  dialect,
}: SchemaParams) => {
  const body = columns
    .filter((c) => c.type)
    .map((c) => {
      const columnType = c.type
      if (!columnType) {
        return null
      }
      let tsType = getColumnType(columnType, 'ts', dialect)
      if (c.enumName && c.availableValues?.length) {
        tsType = formatEnumAsUnionType(c.availableValues, c.isArray)
      } else if (c.isArray) {
        tsType += '[]'
      }

      const isGenerated =
        c.primaryKey || c.isIdentity || typeof c.defaultValue === 'string'
      let typeDef = isGenerated ? `Generated<${tsType}>` : tsType
      if (c.isNullable) {
        typeDef += ' | null'
      }
      const safeKey = toLiteralKey(c.id)
      return `  ${safeKey}: ${typeDef};`
    })
    .filter((line) => line !== null)
    .join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
