import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { chats, chatsMessages, db, waitForMigrations } from '~/drizzle'
import { waitForDatabasesSync } from '~/entities/database/sync'
import { bearerToken } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

let resolvers = Promise.withResolvers()

export function waitForChatsSync() {
  return resolvers.promise
}

export interface ChatMutationMetadata {
  cloudSync?: false
}

export const chatsCollection = createCollection(drizzleCollectionOptions({
  db,
  table: chats,
  primaryColumn: chats.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: async ({ collection, write }) => {
    if (!bearerToken.get() || !navigator.onLine) {
      return
    }

    resolvers = Promise.withResolvers()

    await waitForDatabasesSync()
    const sync = await orpc.chats.sync(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        write(item)
      }
    })
    resolvers.resolve()
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chats.create(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chats.update({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.chats.remove(mutations.map(m => ({ id: m.key })))
  },
}))

export interface ChatMessagesMutationMetadata {
  cloudSync?: false
}

export const chatsMessagesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: chatsMessages,
  primaryColumn: chatsMessages.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: async ({ collection, write }) => {
    if (!bearerToken.get() || !navigator.onLine) {
      return
    }

    await waitForChatsSync()
    const sync = await orpc.chatsMessages.sync(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        write(item)
      }
    })
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chatsMessages.create(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chatsMessages.update({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.chatsMessages.remove(mutations.map(m => ({ id: m.key, chatId: m.modified.chatId })))
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
  onError: () => {},
} satisfies MutationOptions

export function useChatsMessagesSync() {
  const { mutate } = useMutation(syncChatsMessagesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncChatsMessagesMutationOptions) > 0,
  }
}
