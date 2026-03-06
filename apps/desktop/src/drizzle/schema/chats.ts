import type { AppUIMessage } from '@conar/api/ai/tools/helpers'
import { defineRelations } from 'drizzle-orm'
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

export const chatsRelations = defineRelations(
  { chats, chatsMessages, connections },
  r => ({
    chats: {
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
  }),
)

