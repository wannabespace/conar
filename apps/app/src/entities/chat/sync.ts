import type { AppUIMessage } from '@tamery/ai/tools/helpers'
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

export const createChatsCollection = () =>
  createCollection(
    persistedCollectionOptions<Chat, string, never, SyncUtils>({
      ...syncCollectionOptions<Chat>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.chats.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'chats',
        onDelete: async ({ transaction }) => {
          await orpc.chats.remove.call(
            transaction.mutations.map((m) => ({ id: m.key }))
          )
        },
        onInsert: async ({ transaction }) => {
          await orpc.chats.create.call(
            transaction.mutations.map((m) => m.modified)
          )
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.chats.update.call({ id: m.key, ...m.changes })
            )
          )
        },
        sync: ({ rows, signal }) => orpc.chats.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )

export const createChatsMessagesCollection = () =>
  createCollection(
    persistedCollectionOptions<ChatMessage, string, never, SyncUtils>({
      ...syncCollectionOptions<ChatMessage>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.chatsMessages.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'chatsMessages',
        onDelete: async ({ transaction }) => {
          await orpc.chatsMessages.remove.call(
            transaction.mutations.map((m) => ({
              chatId: m.modified.chatId,
              id: m.key,
            }))
          )
        },
        onInsert: async ({ transaction }) => {
          await orpc.chatsMessages.create.call(
            transaction.mutations.map((m) => m.modified)
          )
        },
        onUpdate: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.chatsMessages.update.call({ id: m.key, ...m.changes })
            )
          )
        },
        sync: ({ rows, signal }) =>
          orpc.chatsMessages.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )

export const createChatMessageAction = (data: {
  chat: Chat
  message: ChatMessage
}) => {
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
        chatsMessagesCollection.utils.awaitChange(
          data.message.id,
          data.message.updatedAt
        ),
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
