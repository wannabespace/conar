import type { SchemaParams } from '..'
import * as templates from '../templates'
import { formatEnumAsUnionType, getColumnType, toLiteralKey } from '../utils'

export function generateSchemaTypeScript({
  table,
  columns,
  dialect,
}: SchemaParams) {
  const cols = columns.filter(c => c.type).map((c) => {
    const literalKey = toLiteralKey(c.id)
    let typeScriptType = getColumnType(c.type!, 'ts', dialect)

    if (c.enumName && c.availableValues?.length) {
      typeScriptType = formatEnumAsUnionType(c.availableValues, c.type)
    }
    if (c.isNullable)
      typeScriptType += ' | null'

    return `  ${literalKey}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
