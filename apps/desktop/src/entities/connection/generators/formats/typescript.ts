import type { SchemaParams } from '..'
import { findEnum } from '~/entities/connection/queries/enums'
import * as templates from '../templates'
import { getColumnType, toLiteralKey } from '../utils'

export function generateSchemaTypeScript({
  table,
  columns,
  enums = [],
  dialect,
}: SchemaParams) {
  const cols = columns.filter(c => c.type).map((c) => {
    const key = c.id
    const literalKey = toLiteralKey(key)
    let typeScriptType = getColumnType(c.type!, 'ts', dialect)

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      typeScriptType = foundEnum.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        typeScriptType = `(${typeScriptType})[]`
    }
    if (c.isNullable)
      typeScriptType += ' | null'

    return `  ${literalKey}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).filter(Boolean).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
