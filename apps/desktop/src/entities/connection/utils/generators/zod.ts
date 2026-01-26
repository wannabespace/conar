import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { findEnum, getColumnType } from '../helpers'
import * as templates from '../templates'

export function generateSchemaZod({ table, columns, enums = [], dialect = ConnectionType.Postgres }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType }) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let t = getColumnType(c.type, 'zod', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      const valuesArr = match.values.map(v => `'${v}'`).join(', ')
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
