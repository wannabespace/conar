import { integer, pgSchema, text } from 'drizzle-orm/pg-core'

export const pgCatalog = pgSchema('pg_catalog')

export const pgNamespace = pgCatalog.table('pg_namespace', {
  oid: integer().primaryKey(),
  nspname: text().notNull(),
  nspowner: integer().notNull(),
  nspacl: text(),
})
