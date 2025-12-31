export function sqlSchemaTemplate(table: string, columns: string) {
  return `CREATE TABLE ${table} (
${columns}
);`
}

export function typeScriptSchemaTemplate(table: string, columns: string) {
  return `export interface ${table} {
${columns}
}`
}

export function zodSchemaTemplate(table: string, columns: string) {
  return `import { z } from 'zod';

export const ${table}Schema = z.object({
${columns}
});

export type ${table} = z.infer<typeof ${table}Schema>;`
}

export function prismaSchemaTemplate(table: string, columns: string) {
  return `model ${table} {
${columns}
}`
}

export function drizzleSchemaTemplate(table: string, imports: string[], columns: string) {
  return `import { ${imports.join(', ')}, pgTable } from 'drizzle-orm/pg-core';

export const ${table} = pgTable('${table}', {
${columns}
});`
}

export function kyselySchemaTemplate(table: string, body: string) {
  return `import { Generated } from 'kysely';

export interface ${table}Table {
${body}
}

export interface Database {
  ${table}: ${table}Table;
}`
}

export function sqlQueryTemplate(table: string, where: string) {
  return where
    ? `SELECT * FROM ${table} WHERE ${where};`
    : `SELECT * FROM ${table};`
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
  return conditions
    ? `await db.selectFrom('${table}').selectAll().where(${conditions}).execute()`
    : `await db.selectFrom('${table}').selectAll().execute()`
}
