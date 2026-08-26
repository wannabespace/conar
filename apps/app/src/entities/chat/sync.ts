import type { AppUIMessage } from '@tamery/ai/message'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { orpc } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
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
    persistedCollectionOptions({
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
        sync: ({ rows, signal }) => orpc.chats.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )

export const createChatsMessagesCollection = () =>
  createCollection(
    persistedCollectionOptions({
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
        sync: ({ rows, signal }) =>
          orpc.chatsMessages.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )
