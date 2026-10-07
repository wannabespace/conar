import { camelCase, pascalCase } from 'change-case'

import { toLiteralKey, toStringLiteral } from './utils'

const NEWLINE_RE = /\n/gu

export const sqlSchemaTemplate = (table: string, columns: string) =>
  [`CREATE TABLE ${table} (`, columns, ');'].join('\n')

export const typeScriptSchemaTemplate = (table: string, columns: string) => {
  const pascalName = pascalCase(table)
  return [`export interface ${pascalName} {`, columns, '}'].join('\n')
}

export const zodSchemaTemplate = (table: string, columns: string) => {
  const pascalName = pascalCase(table)
  const camelName = camelCase(table)
  return [
    `import * as z from 'zod';`,
    '',
    `export const ${camelName}Schema = z.object({`,
    columns,
    '});',
    '',
    `export type ${pascalName} = z.infer<typeof ${camelName}Schema>;`,
  ].join('\n')
}

export const prismaSchemaTemplate = (
  table: string,
  fields: string,
  attributes: string[]
) => {
  const modelName = pascalCase(table)
  const blockAttributes = [
    ...attributes,
    ...(modelName === table ? [] : [`@@map("${table}")`]),
  ]
  return [
    `model ${modelName} {`,
    fields,
    ...(blockAttributes.length
      ? ['', ...blockAttributes.map((attribute) => `  ${attribute}`)]
      : []),
    '}',
  ].join('\n')
}

export const drizzleSchemaTemplate = ({
  table,
  coreImports,
  dialectImports,
  columns,
  tableFunc,
  dialectImportPath,
  extraConfig,
}: {
  table: string
  coreImports: string[]
  dialectImports: string[]
  columns: string
  tableFunc: string
  dialectImportPath: string
  extraConfig?: string
}) => {
  const varName = camelCase(table)
  const imports = [
    coreImports.length > 0
      ? `import { ${coreImports.join(', ')} } from 'drizzle-orm';`
      : '',
    `import { ${dialectImports.join(', ')} } from '${dialectImportPath}';`,
  ].filter(Boolean)
  return [
    ...imports,
    '',
    `export const ${varName} = ${tableFunc}(${toStringLiteral(table)}, {`,
    columns,
    `}${extraConfig ? `, (t) => [\n${extraConfig}\n]` : ''});`,
  ].join('\n')
}

export const kyselySchemaTemplate = (
  table: string,
  qualifiedTable: string,
  body: string
) => {
  const pascalTable = pascalCase(table)
  const tableKey = toLiteralKey(qualifiedTable)
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

export const prismaQueryTemplate = (table: string, whereObj: string) => {
  if (whereObj === '{}') {
    return `await prisma.${table}.findMany()`
  }

  const indented = whereObj.replace(NEWLINE_RE, '\n  ')
  return [
    `await prisma.${table}.findMany({`,
    `  where: ${indented}`,
    `})`,
  ].join('\n')
}

export const drizzleQueryTemplate = (table: string, conditions: string) =>
  conditions
    ? [
        'await db.select()',
        `  .from(${table})`,
        '  .where(and(',
        `    ${conditions}`,
        '  ))',
      ].join('\n')
    : `await db.select().from(${table})`

export const kyselyQueryTemplate = (table: string, conditions: string) => {
  const tableLiteral = toStringLiteral(table)
  return conditions
    ? [
        `await db.selectFrom(${tableLiteral})`,
        '  .selectAll()',
        `  .where(${conditions})`,
        '  .execute()',
      ].join('\n')
    : `await db.selectFrom(${tableLiteral}).selectAll().execute()`
}
