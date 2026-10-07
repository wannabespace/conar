import { SQL_OPERATORS } from '@tamery/shared/filters'
import { pascalCase } from 'change-case'

import { tsColumnType } from '~/core/codegen/column-types'
import type { QueryParams, SchemaParams } from '~/core/codegen/types'
import {
  explicitSchema,
  hasType,
  toLiteralKey,
  toStringLiteral,
} from '~/core/codegen/utils'

const qualifiedTable = (
  table: string,
  schema: string,
  dialect: QueryParams['dialect']
) => {
  const tableSchema = explicitSchema(schema, dialect)
  return tableSchema ? `${tableSchema}.${table}` : table
}

export const generateQueryKysely = ({
  table,
  schema,
  filters,
  dialect,
}: QueryParams) => {
  const from = `db.selectFrom(${toStringLiteral(qualifiedTable(table, schema, dialect))})`
  if (filters.length === 0) {
    return `await ${from}.selectAll().execute()`
  }

  const conditions = filters.map((f) => {
    const column = toStringLiteral(f.column)
    if (f.ref.hasValue === false) {
      return `${column}, '${f.ref.operator === 'isNull' ? 'is' : 'is not'}', null`
    }
    const op = SQL_OPERATORS[f.ref.operator]
    const value = f.ref.isArray ? f.values : f.values[0]
    return `${column}, '${op}', ${JSON.stringify(value)}`
  })

  return [
    `await ${from}`,
    '  .selectAll()',
    ...conditions.map((condition) => `  .where(${condition})`),
    '  .execute()',
  ].join('\n')
}

export const generateSchemaKysely = ({
  table,
  schema,
  columns,
  dialect,
}: SchemaParams) => {
  const body = columns
    .filter(hasType)
    .map((c) => {
      const isGenerated = c.isIdentity || typeof c.defaultValue === 'string'
      const tsType = tsColumnType(c, dialect)
      const typeDef = isGenerated ? `Generated<${tsType}>` : tsType
      return `  ${toLiteralKey(c.id)}: ${typeDef}${c.isNullable ? ' | null' : ''};`
    })
    .join('\n')
  const pascalTable = pascalCase(table)
  const tableKey = toLiteralKey(qualifiedTable(table, schema, dialect))

  return [
    ...(body.includes('Generated<')
      ? [`import type { Generated } from 'kysely';`, '']
      : []),
    `export interface ${pascalTable}Table {`,
    body,
    '}',
    '',
    'export interface Database {',
    `  ${tableKey}: ${pascalTable}Table;`,
    '}',
  ].join('\n')
}
