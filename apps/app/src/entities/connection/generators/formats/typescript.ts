import * as templates from '../templates'
import type { SchemaParams } from '../types'
import { formatEnumAsUnionType, getColumnType, toLiteralKey } from '../utils'

export const generateSchemaTypeScript = ({
  table,
  columns,
  dialect,
}: SchemaParams) => {
  const cols = columns
    .filter((c): c is typeof c & { type: string } => !!c.type)
    .map((c) => {
      const literalKey = toLiteralKey(c.id)
      let typeScriptType = getColumnType(c.type, 'ts', dialect)

      if (c.enumName && c.availableValues?.length) {
        typeScriptType = formatEnumAsUnionType(c.availableValues, c.isArray)
      } else if (c.isArray) {
        typeScriptType += '[]'
      }
      if (c.isNullable) {
        typeScriptType += ' | null'
      }

      return `  ${literalKey}${c.isNullable ? '?' : ''}: ${typeScriptType};`
    })
    .join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
