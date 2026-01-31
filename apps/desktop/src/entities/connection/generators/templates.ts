import { camelCase, pascalCase } from 'change-case'
import { toLiteralKey } from './utils'

export function sqlSchemaTemplate(table: string, columns: string) {
  return [
    `CREATE TABLE ${table} (`,
    columns,
    ');',
  ].join('\n')
}

export function typeScriptSchemaTemplate(table: string, columns: string) {
  const pascalName = pascalCase(table)
  return [
    `export interface ${pascalName} {`,
    columns,
    '}',
  ].join('\n')
}

export function zodSchemaTemplate(table: string, columns: string) {
  const pascalName = pascalCase(table)
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1)
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

export function prismaSchemaTemplate(table: string, columns: string) {
  const modelName = pascalCase(table)
  const mapAttribute = modelName !== table ? `\n\n  @@map("${table}")` : ''
  return [
    `model ${modelName} {`,
    columns + mapAttribute,
    '}',
  ].join('\n')
}

export function drizzleSchemaTemplate(
  table: string,
  imports: string[],
  columns: string,
  tableFunc: string = 'pgTable',
  importPath: string = 'drizzle-orm/pg-core',
  extraConfig?: string,
) {
  const escapedTable = table.replace(/'/g, '\\\'')
  const varName = camelCase(table)
  return [
    `import { ${imports.join(', ')}, ${tableFunc} } from '${importPath}';`,
    '',
    `export const ${varName} = ${tableFunc}('${escapedTable}', {`,
    columns,
    `}${extraConfig ? `,(t) => [\n${extraConfig}\n]` : ''});`,
  ].join('\n')
}

export function kyselySchemaTemplate(table: string, body: string) {
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

export function sqlQueryTemplate(table: string, where: string) {
  return where
    ? [
        `SELECT * FROM "${table}"`,
        `WHERE ${where};`,
      ].join('\n')
    : `SELECT * FROM "${table}";`
}

export function prismaQueryTemplate(table: string, whereObj: string) {
  if (whereObj === '{}')
    return `await prisma.${table}.findMany()`

  const indented = whereObj.replace(/\n/g, '\n  ')
  return [
    `await prisma.${table}.findMany({`,
    `  where: ${indented}`,
    `})`,
  ].join('\n')
}

export function drizzleQueryTemplate(table: string, conditions: string) {
  return conditions
    ? [
        'await db.select()',
        `  .from(${table})`,
        '  .where(and(',
        `    ${conditions}`,
        '  ))',
      ].join('\n')
    : `await db.select().from(${table})`
}

export function kyselyQueryTemplate(table: string, conditions: string) {
  const escapedTable = table.replace(/'/g, '\\\'')
  return conditions
    ? [
        `await db.selectFrom('${escapedTable}')`,
        '  .selectAll()',
        `  .where(${conditions})`,
        '  .execute()',
      ].join('\n')
    : `await db.selectFrom('${escapedTable}').selectAll().execute()`
}
