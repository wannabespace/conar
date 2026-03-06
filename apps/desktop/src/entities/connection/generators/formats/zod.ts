import type { SchemaParams } from '..'
import { camelCase } from 'change-case'
import { findEnum } from '~/entities/connection/queries/enums'
import * as templates from '../templates'
import { getColumnType, toLiteralKey } from '../utils'

function buildZodType(
  column: SchemaParams['columns'][number],
  table: string,
  dialect: SchemaParams['dialect'],
  enums: NonNullable<SchemaParams['enums']>,
): string | null {
  let zodType = column.type ? getColumnType(column.type, 'zod', dialect) : null

  if (!zodType)
    return null

  const foundEnum = findEnum(enums, column, table)
  if (foundEnum?.values.length) {
    zodType = `z.enum([${foundEnum.values.map(v => `'${v}'`).join(', ')}])`
    if (column.type === 'set') {
      zodType = `${zodType}.array()`
    }
  }

  if (column.isNullable)
    zodType += '.nullable()'
  if (column.maxLength && column.maxLength > 0 && zodType.includes('z.string')) {
    zodType = zodType.replace('z.string()', `z.string().max(${column.maxLength})`)
  }
  if (zodType.includes('z.number()') && /int/i.test(column.type)) {
    zodType = zodType.replace('z.number()', 'z.int()')
  }
  return zodType
}

export function generateSchemaZod({
  table,
  columns,
  dialect,
  enums = [],
}: SchemaParams) {
  const lines = columns
    .map((column) => {
      const key = toLiteralKey(camelCase(column.id))
      const zodType = buildZodType(column, table, dialect, enums ?? [])

      if (!zodType)
        return null

      return `  ${key}: ${zodType},`
    })
    .filter(Boolean)
    .join('\n')

  return templates.zodSchemaTemplate(table, lines)
}
