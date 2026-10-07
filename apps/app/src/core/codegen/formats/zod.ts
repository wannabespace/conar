import { camelCase, pascalCase } from 'change-case'

import { zodType } from '~/core/codegen/column-types'
import type { SchemaParams } from '~/core/codegen/types'
import { hasType, toLiteralKey, toStringLiteral } from '~/core/codegen/utils'

export const generateSchemaZod = ({ table, columns }: SchemaParams) => {
  const fields = columns.filter(hasType).map((column) => {
    const base =
      column.enumName && column.availableValues?.length
        ? `z.enum([${column.availableValues.map(toStringLiteral).join(', ')}])`
        : zodType(column)
    const array = column.isArray ? '.array()' : ''
    const nullable = column.isNullable ? '.nullable()' : ''
    return `  ${toLiteralKey(column.id)}: ${base}${array}${nullable},`
  })
  const schemaName = `${camelCase(table)}Schema`

  return [
    `import * as z from 'zod';`,
    '',
    `export const ${schemaName} = z.object({`,
    fields.join('\n'),
    '});',
    '',
    `export type ${pascalCase(table)} = z.infer<typeof ${schemaName}>;`,
  ].join('\n')
}
