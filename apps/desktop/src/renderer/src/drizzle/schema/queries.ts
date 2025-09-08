import { createSelectSchema } from 'drizzle-arktype'
import { relations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { databases } from './databases'

export const queries = pgTable('queries', ({ uuid, text }) => ({
  ...baseTable,
  databaseId: uuid().references(() => databases.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  query: text().notNull(),
})).enableRLS()

export const queriesRelations = relations(queries, ({ one }) => ({
  database: one(databases, {
    fields: [queries.databaseId],
    references: [databases.id],
  }),
}))

export const queriesSelectSchema = createSelectSchema(queries)
