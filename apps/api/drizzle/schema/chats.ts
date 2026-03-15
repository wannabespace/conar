import type { AppUIMessage } from '~/ai/tools/helpers'
import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedJson } from '../utils'
import { users } from './auth'
import { connections } from './connections'

export const chats = pgTable('chats', {
  ...baseTable,
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectionId: uuid().references(() => connections.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
  activeStreamId: uuid(),
}, t => [
  index().on(t.userId),
  index().on(t.connectionId),
])

export const chatsSelectSchema = createSelectSchema(chats)
export const chatsInsertSchema = createInsertSchema(chats)
export const chatsUpdateSchema = createUpdateSchema(chats)

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: encryptedJson().$type<AppUIMessage['parts'][number]>().array().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  metadata: encryptedJson().$type<NonNullable<AppUIMessage['metadata']>>(),
}, t => [
  index().on(t.chatId),
  index().on(t.role),
])

export const chatsMessagesSelectSchema = createSelectSchema(chatsMessages)
export const chatsMessagesInsertSchema = createInsertSchema(chatsMessages)
export const chatsMessagesUpdateSchema = createUpdateSchema(chatsMessages)

export const chatsRelations = defineRelations({ chats, chatsMessages, users, connections }, r => ({
  chats: {
    user: r.one.users({
      from: r.chats.userId,
      to: r.users.id,
    }),
    connection: r.one.connections({
      from: r.chats.connectionId,
      to: r.connections.id,
    }),
    messages: r.many.chatsMessages(),
  },
  chatsMessages: {
    chat: r.one.chats({
      from: r.chatsMessages.chatId,
      to: r.chats.id,
    }),
  },
}))
