import type { AppUIMessage } from '@conar/shared/ai'
import { relations } from 'drizzle-orm'
import { pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedJson } from '../utils'
import { users } from './auth'
import { databases } from './databases'

export const chats = pgTable('chats', {
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  databaseId: uuid().references(() => databases.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  activeStreamId: uuid(),
}).enableRLS()

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: encryptedJson().array().$type<AppUIMessage['parts']>().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  metadata: encryptedJson().$type<NonNullable<AppUIMessage['metadata']>>(),
})

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
  database: one(databases, {
    fields: [chats.databaseId],
    references: [databases.id],
  }),
  messages: many(chatsMessages),
}))

export const chatsMessagesRelations = relations(chatsMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatsMessages.chatId],
    references: [chats.id],
  }),
}))
