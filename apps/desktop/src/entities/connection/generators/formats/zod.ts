import type { SchemaParams } from '..'
import { camelCase } from 'change-case'
import { findEnum } from '../../sql/enums'
import * as templates from '../templates'
import { getColumnType } from '../utils'

export function generateSchemaZod({
  table,
  columns,
  dialect,
  enums = [],
}: SchemaParams) {
  const cols = columns.map((c) => {
    const key = camelCase(c.id)
    const safeId = /^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`
    let t = getColumnType(c.type, 'zod', dialect)

    const foundEnum = findEnum(enums, c, table)
    if (foundEnum?.values.length) {
      const valuesArr = foundEnum.values.map(v => `'${v}'`).join(', ')
      t = `z.enum([${valuesArr}])`
      if (c.type === 'set')
        t = `${t}.array()`
    }

    if (c.isNullable)
      t += '.nullable()'

    if (c.maxLength && c.maxLength > 0 && t.includes('z.string')) {
      t = t.replace('z.string()', `z.string().max(${c.maxLength})`)
    }

    if (t.includes('z.number()') && /int/i.test(c.type || '')) {
      t = t.replace('z.number()', 'z.int()')
    }

    return `  ${safeId}: ${t},`
  }).join('\n')

  return templates.zodSchemaTemplate(table, cols)
}
