import * as templates from '~/core/codegen/templates'
import type { SchemaParams } from '~/core/codegen/types'
import {
  getColumnType,
  toLiteralKey,
  toStringLiteral,
} from '~/core/codegen/utils'

const buildZodType = (
  column: SchemaParams['columns'][number],
  dialect: SchemaParams['dialect']
): string | null => {
  let zodType = column.type ? getColumnType(column.type, 'zod', dialect) : null

  if (!zodType) {
    return null
  }

  if (column.enumName && column.availableValues?.length) {
    zodType = `z.enum([${column.availableValues.map(toStringLiteral).join(', ')}])`
  }

  if (
    column.maxLength &&
    column.maxLength > 0 &&
    zodType.includes('z.string')
  ) {
    zodType = zodType.replace(
      'z.string()',
      `z.string().max(${column.maxLength})`
    )
  }

  if (
    zodType.includes('z.number()') &&
    column.type &&
    /int/iu.test(column.type)
  ) {
    zodType = zodType.replace('z.number()', 'z.int()')
  }

  if (column.isArray) {
    zodType += '.array()'
  }
  if (column.isNullable) {
    zodType += '.nullable()'
  }
  return zodType
}

export const generateSchemaZod = ({
  table,
  columns,
  dialect,
}: SchemaParams) => {
  const lines = columns
    .map((column) => {
      const key = toLiteralKey(column.id)
      const zodType = buildZodType(column, dialect)

      if (!zodType) {
        return null
      }

      return `  ${key}: ${zodType},`
    })
    .filter(Boolean)
    .join('\n')

  return templates.zodSchemaTemplate(table, lines)
}
