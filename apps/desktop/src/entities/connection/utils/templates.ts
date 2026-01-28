import { pascalCase } from 'change-case'
import { safePascalCase } from './helpers'

export function sqlSchemaTemplate(table: string, columns: string) {
  return `CREATE TABLE ${table} (
${columns}
);`
}

export function typeScriptSchemaTemplate(table: string, columns: string) {
  const pascalName = pascalCase(table)
  return `export interface ${pascalName} {
${columns}
}`
}

export function zodSchemaTemplate(table: string, columns: string) {
  const pascalName = pascalCase(table)
  const camelName = pascalName.charAt(0).toLowerCase() + pascalName.slice(1)
  return `import { z } from 'zod';

export const ${camelName}Schema = z.object({
${columns}
});

export type ${pascalName} = z.infer<typeof ${camelName}Schema>;`
}

export function prismaSchemaTemplate(table: string, columns: string) {
  const modelName = safePascalCase(table)
  const mapAttribute = modelName !== table ? `\n  @@map("${table}")` : ''
  return `model ${modelName} {
${columns}${mapAttribute}
}`
}

export function drizzleSchemaTemplate(table: string, imports: string[], columns: string, tableFunc: string = 'pgTable', importPath: string = 'drizzle-orm/pg-core', extraConfig?: string) {
  const escapedTable = table.replace(/'/g, '\\\'')
  const isValidId = /^[a-z_$][\w$]*$/i.test(table)
  const varName = isValidId ? table : pascalCase(table)
  return `import { ${imports.join(', ')}, ${tableFunc} } from '${importPath}';

export const ${varName} = ${tableFunc}('${escapedTable}', {
${columns}
}${extraConfig ? `,(t) => [\n${extraConfig}\n]` : ''});`
}

export function kyselySchemaTemplate(table: string, body: string) {
  const pascalTable = pascalCase(table)
  const safeTableKey = /^[a-z_$][\w$]*$/i.test(table) ? table : `'${table}'`
  return `import { Generated } from 'kysely';

export interface ${pascalTable}Table {
${body}
}

export interface Database {
  ${safeTableKey}: ${pascalTable}Table;
}`
}

export function sqlQueryTemplate(table: string, where: string) {
  return where
    ? `SELECT * FROM "${table}"\nWHERE ${where};`
    : `SELECT * FROM "${table}";`
}

export function prismaQueryTemplate(table: string, whereObj: string) {
  if (whereObj === '{}')
    return `await prisma.${table}.findMany()`

  const indented = whereObj.replace(/\n/g, '\n  ')
  return `await prisma.${table}.findMany({
  where: ${indented}
})`
}

export function drizzleQueryTemplate(table: string, conditions: string) {
  return conditions
    ? `await db.select()\n  .from(${table})\n  .where(and(\n    ${conditions}\n  ))`
    : `await db.select().from(${table})`
}

export function kyselyQueryTemplate(table: string, conditions: string) {
  const escapedTable = table.replace(/'/g, '\\\'')
  return conditions
    ? `await db.selectFrom('${escapedTable}')\n  .selectAll()\n  .where(${conditions})\n  .execute()`
    : `await db.selectFrom('${escapedTable}').selectAll().execute()`
}
