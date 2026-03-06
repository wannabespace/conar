import type { AppUIMessage } from '@conar/api/ai/tools/helpers'
import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { connections } from './connections'

export const chats = pgTable('chats', {
  ...baseTable,
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
})

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: jsonb().array().$type<AppUIMessage['parts']>().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  metadata: jsonb().$type<NonNullable<AppUIMessage['metadata']>>(),
})

export const chatsRelations = relations(chats, ({ one, many }) => ({
  connection: one(connections, {
    fields: [chats.connectionId],
    references: [connections.id],
  }),
  messages: many(chatsMessages),
}))

export const chatsMessagesRelations = relations(chatsMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatsMessages.chatId],
    references: [chats.id],
  }),
}))
