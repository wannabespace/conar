import type { SchemaParams } from '..'
import * as templates from '../templates'
import { getColumnType, toLiteralKey } from '../utils'

function buildZodType(
  column: SchemaParams['columns'][number],
  dialect: SchemaParams['dialect'],
): string | null {
  let zodType = column.type ? getColumnType(column.type, 'zod', dialect) : null

  if (!zodType)
    return null

  if (column.enumName && column.availableValues?.length) {
    zodType = `z.enum([${column.availableValues.map(v => `'${v}'`).join(', ')}])`
    if (column.type === 'set') {
      zodType = `${zodType}.array()`
    }
  }

  if (column.isNullable)
    zodType += '.nullable()'
  if (column.maxLength && column.maxLength > 0 && zodType.includes('z.string')) {
    zodType = zodType.replace('z.string()', `z.string().max(${column.maxLength})`)
  }
  // eslint-disable-next-line e18e/prefer-static-regex
  if (zodType.includes('z.number()') && /int/i.test(column.type!)) {
    zodType = zodType.replace('z.number()', 'z.int()')
  }
  return zodType
}

export function generateSchemaZod({
  table,
  columns,
  dialect,
}: SchemaParams) {
  const lines = columns
    .map((column) => {
      const key = toLiteralKey(column.id)
      const zodType = buildZodType(column, dialect)

      if (!zodType)
        return null

      return `  ${key}: ${zodType},`
    })
    .filter(Boolean)
    .join('\n')

  return templates.zodSchemaTemplate(table, lines)
}
