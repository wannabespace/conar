import type { AppUIMessage } from '@tamery/ai/tools/helpers'
import { defineRelationsPart } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/arktype'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { encryptedJson } from '../utils'
import { users } from './auth'
import { connectionsResources } from './connections'

export const chats = d.snakeCase.table('chats', {
  ...baseTable,
  userId: d.uuid().references(() => users.id, { onDelete: 'cascade' }).notNull(),
  connectionResourceId: d.uuid()
    .references(() => connectionsResources.id, { onDelete: 'cascade' })
    .notNull(),
  title: d.text(),
  activeStreamId: d.uuid(),
}, t => [
  d.index().on(t.userId),
  d.index().on(t.connectionResourceId),
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

export const chatsRelations = defineRelationsPart({ chats, chatsMessages, users, connectionsResources }, r => ({
  chats: {
    user: r.one.users({
      from: r.chats.userId,
      to: r.users.id,
    }),
    connectionResource: r.one.connectionsResources({
      from: r.chats.connectionResourceId,
      to: r.connectionsResources.id,
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
