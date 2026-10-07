import { pascalCase } from 'change-case'

import { tsColumnType } from '~/core/codegen/column-types'
import type { SchemaParams } from '~/core/codegen/types'
import { hasType, toLiteralKey } from '~/core/codegen/utils'

export const generateSchemaTypeScript = ({
  table,
  columns,
  dialect,
}: SchemaParams) => {
  const fields = columns
    .filter(hasType)
    .map(
      (c) =>
        `  ${toLiteralKey(c.id)}: ${tsColumnType(c, dialect)}${c.isNullable ? ' | null' : ''};`
    )

  return [
    `export interface ${pascalCase(table)} {`,
    fields.join('\n'),
    '}',
  ].join('\n')
}
