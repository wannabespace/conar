import type { AppUIMessage } from '@conar/ai/tools/helpers'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { type } from 'arktype'
import { shapeOptions } from '~/lib/electric'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

export const chatsSchema = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  connectionResourceId: 'string | null',
  title: 'string | null',
})

export type Chat = typeof chatsSchema.infer

// @ts-expect-error waiting for https://github.com/TanStack/db/pull/1453
export const chatsCollection = createCollection(persistedCollectionOptions<Chat>({
  ...electricCollectionOptions({
    schema: chatsSchema,
    id: 'chats',
    shapeOptions: shapeOptions('chats'),
    getKey: item => item.id,
    onInsert: async ({ transaction }) => {
      return orpc.chats.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      const result = await Promise.all(transaction.mutations
        .map(m => orpc.chats.update.call({ id: m.key, ...m.changes })))
      return { txid: result.map(r => r.txid) }
    },
    onDelete: async ({ transaction }) => {
      return orpc.chats.remove.call(transaction.mutations.map(m => ({ id: m.key })))
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))

export const chatsMessagesSchema = type({
  id: 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
  chatId: 'string',
  parts: type('unknown[]' as type.cast<AppUIMessage['parts']>),
  role: type('string' as type.cast<AppUIMessage['role']>),
  metadata: type('object | null' as type.cast<NonNullable<AppUIMessage['metadata']> | null>),
})

export type ChatMessage = typeof chatsMessagesSchema.infer

// @ts-expect-error waiting for https://github.com/TanStack/db/pull/1453
export const chatsMessagesCollection = createCollection(persistedCollectionOptions<ChatMessage>({
  ...electricCollectionOptions({
    schema: chatsMessagesSchema,
    id: 'chats-messages',
    shapeOptions: shapeOptions('chats-messages'),
    getKey: item => item.id,
    onInsert: async ({ transaction }) => {
      return orpc.chatsMessages.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      const result = await Promise.all(transaction.mutations
        .map(m => orpc.chatsMessages.update.call({ id: m.key, ...m.changes })))
      return { txid: result.map(r => r.txid) }
    },
    onDelete: async ({ transaction }) => {
      return orpc.chatsMessages.remove.call(transaction.mutations.map(m => ({ id: m.key, chatId: m.modified.chatId })))
    },
  }),
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  persistence,
  schemaVersion: 1,
}))
