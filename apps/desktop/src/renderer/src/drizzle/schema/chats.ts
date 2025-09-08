import type { AppUIMessage } from '@conar/shared/ai-tools'
import { createSelectSchema } from 'drizzle-arktype'
import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { databases } from './databases'

export const chats = pgTable('chats', {
  ...baseTable,
  databaseId: uuid().references(() => databases.id, { onDelete: 'cascade' }),
  title: text(),
})

export const chatsSelectSchema = createSelectSchema(chats)

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: jsonb().array().$type<AppUIMessage['parts']>().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  // eslint-disable-next-line ts/no-empty-object-type
  metadata: jsonb().$type<{}>(),
})

export const chatsMessagesSelectSchema = createSelectSchema(chatsMessages)

export const chatsRelations = relations(chats, ({ one, many }) => ({
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
