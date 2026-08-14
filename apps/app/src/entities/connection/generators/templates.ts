import { camelCase, pascalCase } from 'change-case'

import { toLiteralKey } from './utils'

const SINGLE_QUOTE_RE = /'/gu
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

export const prismaSchemaTemplate = (table: string, columns: string) => {
  const modelName = pascalCase(table)
  const mapAttribute = modelName === table ? '' : `\n\n  @@map("${table}")`
  return [`model ${modelName} {`, columns + mapAttribute, '}'].join('\n')
}

export const drizzleSchemaTemplate = ({
  table,
  coreImports,
  dialectImports,
  columns,
  tableFunc = 'pgTable',
  dialectImportPath = 'drizzle-orm/pg-core',
  extraConfig,
}: {
  table: string
  coreImports: string[]
  dialectImports: string[]
  columns: string
  tableFunc: string
  dialectImportPath?: string
  extraConfig?: string
}) => {
  const escapedTable = table.replace(SINGLE_QUOTE_RE, "\\'")
  const varName = camelCase(table)
  return [
    `import { ${coreImports.join(', ')} } from 'drizzle-orm';`,
    `import { ${dialectImports.join(', ')}, ${tableFunc} } from '${dialectImportPath}';`,
    '',
    `export const ${varName} = ${tableFunc}('${escapedTable}', {`,
    columns,
    `}${extraConfig ? `,(t) => [\n${extraConfig}\n]` : ''});`,
  ].join('\n')
}

export const kyselySchemaTemplate = (table: string, body: string) => {
  const pascalTable = pascalCase(table)
  const tableKey = toLiteralKey(table)
  return [
    `import { Generated } from 'kysely';`,
    '',
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
  const escapedTable = table.replace(SINGLE_QUOTE_RE, "\\'")
  return conditions
    ? [
        `await db.selectFrom('${escapedTable}')`,
        '  .selectAll()',
        `  .where(${conditions})`,
        '  .execute()',
      ].join('\n')
    : `await db.selectFrom('${escapedTable}').selectAll().execute()`
}
