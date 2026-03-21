import type { AppUIMessage } from '@conar/api/ai/tools/helpers'
import { defineRelations } from 'drizzle-orm'
import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'
import { connectionsResources } from './connections'

export const chats = pgTable('chats', {
  ...baseTable,
  connectionResourceId: uuid().references(() => connectionsResources.id, { onDelete: 'cascade' }).notNull(),
  title: text(),
})

export const chatsMessages = pgTable('chats_messages', {
  ...baseTable,
  chatId: uuid().references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  parts: jsonb().$type<AppUIMessage['parts'][number]>().array().notNull(),
  role: text().$type<AppUIMessage['role']>().notNull(),
  metadata: jsonb().$type<NonNullable<AppUIMessage['metadata']>>(),
})

export const chatsRelations = defineRelations(
  { chats, chatsMessages, connectionsResources },
  r => ({
    chats: {
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
  }),
)
