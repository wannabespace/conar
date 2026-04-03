import type { SchemaParams } from '..'
import { findEnum } from '~/entities/connection/queries/enums'
import * as templates from '../templates'
import { formatEnumAsUnionType, getColumnType, toLiteralKey } from '../utils'

export function generateSchemaTypeScript({
  table,
  columns,
  enums = [],
  dialect,
}: SchemaParams) {
  const cols = columns.map((c) => {
    const literalKey = toLiteralKey(c.id)
    let typeScriptType = getColumnType(c.type, 'ts', dialect)

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      typeScriptType = formatEnumAsUnionType(foundEnum.values, c.type)
    }
    if (c.isNullable)
      typeScriptType += ' | null'

    return `  ${literalKey}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
