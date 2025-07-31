import type { AppUIMessage } from '@conar/shared/ai'
import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { databases } from './databases'

export const chats = pgTable('chats', {
  ...baseTable,
  databaseId: uuid().references(() => databases.id, { onDelete: 'cascade' }),
  title: text().notNull(),
  messages: jsonb().array().$type<AppUIMessage[]>().notNull(),
}).enableRLS()

export const chatsRelations = relations(chats, ({ one }) => ({
  database: one(databases, {
    fields: [chats.databaseId],
    references: [databases.id],
  }),
}))
