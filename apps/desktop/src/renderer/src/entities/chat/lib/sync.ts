import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { chats, chatsMessages, db, waitForMigrations } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database'
import { bearerToken } from '~/lib/auth'
import { drizzleCollectionOptions } from '~/lib/db'
import { orpc } from '~/lib/orpc'

const { promise, resolve } = Promise.withResolvers()

export function waitForChatsSync() {
  return promise
}

export const chatsCollection = createCollection(drizzleCollectionOptions({
  db,
  table: chats,
  primaryColumn: chats.id,
  sync: {
    start: false,
    beforeSync: waitForMigrations,
    sync: async ({ collection, write }) => {
      if (!bearerToken.get() || !navigator.onLine) {
        return
      }

      await waitForDatabasesSync()
      const existing = collection.toArray
      const sync = await orpc.chats.sync(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

      sync.forEach((item) => {
        if (item.type === 'delete') {
          write({ type: 'delete', value: collection.get(item.value)! })
        }
        else {
          write(item)
        }
      })
      resolve()
    },
  },
}))

export const chatsMessagesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: chatsMessages,
  primaryColumn: chatsMessages.id,
  sync: {
    start: false,
    beforeSync: waitForMigrations,
    sync: async ({ collection, write }) => {
      if (!bearerToken.get() || !navigator.onLine) {
        return
      }

      await waitForChatsSync()
      const existing = collection.toArray
      const sync = await orpc.chatsMessages.sync(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

      sync.forEach((item) => {
        if (item.type === 'delete') {
          write({ type: 'delete', value: collection.get(item.value)! })
        }
        else {
          write(item)
        }
      })
    },
  },
}))

const syncChatsMutationOptions = {
  mutationKey: ['sync-chats'],
  mutationFn: chatsCollection.utils.runSync,
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
  mutationFn: chatsMessagesCollection.utils.runSync,
} satisfies MutationOptions

export function useChatsMessagesSync() {
  const { mutate } = useMutation(syncChatsMessagesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncChatsMessagesMutationOptions) > 0,
  }
}
