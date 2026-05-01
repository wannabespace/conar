import type { AppUIMessage } from '~/ai/tools/helpers'
import { defineRelations } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedJson } from '../utils'
import { users } from './auth'
import { connections, connectionsResources } from './connections'

export const chats = d.snakeCase.table('chats', {
  ...baseTable,
  userId: d.uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  // TODO: remove it in the future versions, saving connectionId for backward compatibility
  connectionId: d.uuid().references(() => connections.id, { onDelete: 'cascade' }),
  connectionResourceId: d.uuid().references(() => connectionsResources.id, { onDelete: 'cascade' }),
  title: d.text(),
  activeStreamId: d.uuid(),
}, t => [
  d.index().on(t.userId),
  d.index().on(t.connectionId),
])

export const chatsSelectSchema = createSelectSchema(chats)
export const chatsInsertSchema = createInsertSchema(chats)
export const chatsUpdateSchema = createUpdateSchema(chats)

export const chatsMessages = d.snakeCase.table('chats_messages', {
  ...baseTable,
  chatId: d.uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: encryptedJson().$type<AppUIMessage['parts'][number]>().array().notNull(),
  role: d.text().$type<AppUIMessage['role']>().notNull(),
  metadata: encryptedJson().$type<NonNullable<AppUIMessage['metadata']>>(),
}, t => [
  d.index().on(t.chatId),
  d.index().on(t.role),
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
