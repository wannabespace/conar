import type { AppUIMessage } from '@conar/shared/ai-tools'
import { createSelectSchema } from 'drizzle-arktype'
import { relations } from 'drizzle-orm'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
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
}, t => [
  index().on(t.userId),
  index().on(t.databaseId),
]).enableRLS()

export const chatsSelectSchema = createSelectSchema(chats)

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: encryptedJson().array().$type<AppUIMessage['parts']>().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  metadata: encryptedJson().$type<NonNullable<AppUIMessage['metadata']>>(),
}, t => [
  index().on(t.chatId),
  index().on(t.role),
]).enableRLS()

export const chatsMessagesSelectSchema = createSelectSchema(chatsMessages)

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
