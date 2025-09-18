import { createInsertSchema, createSelectSchema } from 'drizzle-arktype'
import { relations } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedText } from '../utils'
import { users } from './auth'
import { databases } from './databases'

export const queries = pgTable('queries', ({ uuid, text }) => ({
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  databaseId: uuid().references(() => databases.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  query: encryptedText().notNull(),
})).enableRLS()

export const queriesSelectSchema = createSelectSchema(queries)
export const queriesInsertSchema = createInsertSchema(queries)

export const queriesRelations = relations(queries, ({ one }) => ({
  user: one(users, {
    fields: [queries.userId],
    references: [users.id],
  }),
  database: one(databases, {
    fields: [queries.databaseId],
    references: [databases.id],
  }),
}))
