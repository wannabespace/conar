import { toPascalCase } from './helpers'

export function sqlSchemaTemplate(table: string, columns: string) {
  return `CREATE TABLE ${table} (
${columns}
);`
}

export function typeScriptSchemaTemplate(table: string, columns: string) {
  const pascalName = toPascalCase(table)
  return `export interface ${pascalName} {
${columns}
}`
}

export function zodSchemaTemplate(table: string, columns: string) {
  const pascalName = toPascalCase(table)
  return `import { z } from 'zod';

export const ${pascalName}Schema = z.object({
${columns}
});

export type ${pascalName} = z.infer<typeof ${pascalName}Schema>;`
}

export function prismaSchemaTemplate(table: string, columns: string) {
  const pascalName = toPascalCase(table)
  const mapAttribute = pascalName !== table ? `\n  @@map("${table}")` : ''
  return `model ${pascalName} {
${columns}${mapAttribute}
}`
}

export function drizzleSchemaTemplate(table: string, imports: string[], columns: string, tableFunc: string = 'pgTable', importPath: string = 'drizzle-orm/pg-core') {
  const escapedTable = table.replace(/'/g, '\\\'')
  const pascalName = toPascalCase(table)
  return `import { ${imports.join(', ')}, ${tableFunc} } from '${importPath}';

export const ${pascalName} = ${tableFunc}('${escapedTable}', {
${columns}
});`
}

export function kyselySchemaTemplate(table: string, body: string) {
  const pascalTable = toPascalCase(table)
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
    ? `SELECT * FROM "${table}" WHERE ${where};`
    : `SELECT * FROM "${table}";`
}

export function prismaQueryTemplate(table: string, whereObj: string) {
  return whereObj !== '{}'
    ? `await prisma.${table}.findMany({ where: ${whereObj} })`
    : `await prisma.${table}.findMany()`
}

export function drizzleQueryTemplate(table: string, conditions: string) {
  return conditions
    ? `await db.select().from(${table}).where(and(${conditions}))`
    : `await db.select().from(${table})`
}

export function kyselyQueryTemplate(table: string, conditions: string) {
  const escapedTable = table.replace(/'/g, '\\\'')
  return conditions
    ? `await db.selectFrom('${escapedTable}').selectAll().where(${conditions}).execute()`
    : `await db.selectFrom('${escapedTable}').selectAll().execute()`
}
