import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { chats, chatsMessages } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database'
import { pgLiteCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

export const chatsCollection = createCollection(pgLiteCollectionOptions({
  table: chats,
  getPrimaryColumn: chats => chats.id,
}))

export const chatsMessagesCollection = createCollection(pgLiteCollectionOptions({
  table: chatsMessages,
  getPrimaryColumn: chatsMessages => chatsMessages.id,
}))

const { promise, resolve } = Promise.withResolvers()

export function waitForChatsSync() {
  return promise
}

async function syncChats() {
  await waitForDatabasesSync()
  const existing = await chatsCollection.toArrayWhenReady()
  const iterator = await orpc.sync.chats(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    if (import.meta.env.DEV) {
      console.log('syncChats event', event)
    }
    // Temporary only one event
    if (event.type === 'sync') {
      event.data.forEach((item) => {
        if (item.type === 'insert') {
          chatsCollection.insert(item.value)
        }
        else if (item.type === 'update') {
          chatsCollection.update(item.value.id, (draft) => {
            Object.assign(draft, item.value)
          })
        }
        else if (item.type === 'delete') {
          chatsCollection.delete(item.value)
        }
      })
      resolve()
    }
  }
}

async function syncChatsMessages() {
  await waitForChatsSync()
  const existing = await chatsMessagesCollection.toArrayWhenReady()
  const iterator = await orpc.sync.chatsMessages(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    if (import.meta.env.DEV) {
      console.log('syncChatsMessages event', event)
    }
    // Temporary only one event
    if (event.type === 'sync') {
      event.data.forEach((item) => {
        if (item.type === 'insert') {
          chatsMessagesCollection.insert(item.value)
        }
        else if (item.type === 'update') {
          chatsMessagesCollection.update(item.value.id, (draft) => {
            Object.assign(draft, item.value)
          })
        }
        else if (item.type === 'delete') {
          chatsMessagesCollection.delete(item.value)
        }
      })
    }
  }
}

const syncChatsMutationOptions = {
  mutationKey: ['sync-chats'],
  mutationFn: syncChats,
} satisfies MutationOptions

export function useChatsSync() {
  const { mutate } = useMutation(syncChatsMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncChatsMutationOptions) > 0,
  }
}

const syncChatsMessagesMutationOptions = {
  mutationKey: ['sync-messages-chats'],
  mutationFn: syncChatsMessages,
} satisfies MutationOptions

export function useChatsMessagesSync() {
  const { mutate } = useMutation(syncChatsMessagesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncChatsMessagesMutationOptions) > 0,
  }
}
