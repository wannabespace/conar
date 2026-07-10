import type { AppUIMessage } from '@conar/ai/tools/helpers'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection, createTransaction } from '@tanstack/react-db'

import { getCollections } from '~/entities/collections'
import { orpc } from '~/lib/orpc'
import type { BaseTable, SyncUtils } from '~/lib/sync'
import { persistence, syncCollectionOptions } from '~/lib/sync'

export interface Chat extends BaseTable {
  connectionResourceId: string
  title: string | null
}

export interface ChatMessage extends BaseTable {
  chatId: string
  parts: AppUIMessage['parts']
  role: AppUIMessage['role']
  metadata: NonNullable<AppUIMessage['metadata']> | null
}

export function createChatsCollection() {
  return createCollection(
    persistedCollectionOptions<Chat, string, never, SyncUtils>({
      ...syncCollectionOptions<Chat>({
        id: 'chats',
        getKey: (item) => item.id,
        events: ({ signal }) => orpc.chats.events.call({}, { signal }),
        sync: ({ rows, signal }) => orpc.chats.sync.call(rows, { signal }),
        onInsert: async ({ transaction }) => {
          await orpc.chats.create.call(transaction.mutations.map((m) => m.modified))
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(transaction.mutations.map((m) => orpc.chats.update.call({ id: m.key, ...m.changes })))
        },
        onDelete: async ({ transaction }) => {
          await orpc.chats.remove.call(transaction.mutations.map((m) => ({ id: m.key })))
        },
      }),
      persistence,
      schemaVersion: 1,
    }),
  )
}

export function createChatsMessagesCollection() {
  return createCollection(
    persistedCollectionOptions<ChatMessage, string, never, SyncUtils>({
      ...syncCollectionOptions<ChatMessage>({
        id: 'chatsMessages',
        getKey: (item) => item.id,
        events: ({ signal }) => orpc.chatsMessages.events.call({}, { signal }),
        sync: ({ rows, signal }) => orpc.chatsMessages.sync.call(rows, { signal }),
        onInsert: async ({ transaction }) => {
          await orpc.chatsMessages.create.call(transaction.mutations.map((m) => m.modified))
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(transaction.mutations.map((m) => orpc.chatsMessages.update.call({ id: m.key, ...m.changes })))
        },
        onDelete: async ({ transaction }) => {
          await orpc.chatsMessages.remove.call(transaction.mutations.map((m) => ({ id: m.key, chatId: m.modified.chatId })))
        },
      }),
      persistence,
      schemaVersion: 1,
    }),
  )
}

export function createChatMessageAction(data: { chat: Chat; message: ChatMessage }) {
  const { chatsCollection, chatsMessagesCollection } = getCollections()
  const isNewChat = !chatsCollection.has(data.chat.id)

  const tx = createTransaction({
    mutationFn: async () => {
      if (isNewChat) {
        await orpc.chats.create.call(data.chat)
      }

      await orpc.chatsMessages.create.call(data.message)
      await orpc.ai.generateTitle.call({ chatId: data.chat.id })
      await Promise.all([
        chatsCollection.utils.awaitChange(data.chat.id, data.chat.updatedAt),
        chatsMessagesCollection.utils.awaitChange(data.message.id, data.message.updatedAt),
      ])
    },
  })

  tx.mutate(() => {
    if (isNewChat) {
      chatsCollection.insert(data.chat)
    }

    chatsMessagesCollection.insert(data.message)
  })

  return tx
}
