import type { SchemaParams } from '..'
import { camelCase } from 'change-case'
import { findEnum } from '../../sql/enums'
import * as templates from '../templates'
import { getColumnType } from '../utils'

export function generateSchemaTypeScript({
  table,
  columns,
  enums = [],
  dialect,
}: SchemaParams) {
  const cols = columns.map((c) => {
    const key = camelCase(c.id)
    const safeId = /^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`
    let typeScriptType = getColumnType(c.type, 'ts', dialect) || 'any'

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      typeScriptType = foundEnum.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        typeScriptType = `(${typeScriptType})[]`
    }

    if (c.isNullable)
      typeScriptType += ' | null'

    return `  ${safeId}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
