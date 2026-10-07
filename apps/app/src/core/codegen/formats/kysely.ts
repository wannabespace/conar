import { SQL_OPERATORS } from '@tamery/shared/filters'

import * as templates from '~/core/codegen/templates'
import type { QueryParams, SchemaParams } from '~/core/codegen/types'
import {
  explicitSchema,
  formatEnumAsUnionType,
  getColumnType,
  toLiteralKey,
  toStringLiteral,
} from '~/core/codegen/utils'

const qualifiedTable = (
  table: string,
  schema: string,
  dialect: QueryParams['dialect']
) => {
  const tableSchema = explicitSchema(schema, dialect)
  return tableSchema ? `${tableSchema}.${table}` : table
}

export const generateQueryKysely = ({
  table,
  schema,
  filters,
  dialect,
}: QueryParams) => {
  const conditions = filters
    .map((f) => {
      const column = toStringLiteral(f.column)
      if (f.ref.hasValue === false) {
        return `${column}, '${f.ref.operator === 'isNull' ? 'is' : 'is not'}', null`
      }
      const op = SQL_OPERATORS[f.ref.operator]
      const value = f.ref.isArray ? f.values : f.values[0]
      return `${column}, '${op}', ${JSON.stringify(value)}`
    })
    .join(')\n  .where(')

  return templates.kyselyQueryTemplate(
    qualifiedTable(table, schema, dialect),
    conditions
  )
}

export const generateSchemaKysely = ({
  table,
  schema,
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

      const isGenerated = c.isIdentity || typeof c.defaultValue === 'string'
      let typeDef = isGenerated ? `Generated<${tsType}>` : tsType
      if (c.isNullable) {
        typeDef += ' | null'
      }
      const safeKey = toLiteralKey(c.id)
      return `  ${safeKey}: ${typeDef};`
    })
    .filter((line) => line !== null)
    .join('\n')

  return templates.kyselySchemaTemplate(
    table,
    qualifiedTable(table, schema, dialect),
    body
  )
}
