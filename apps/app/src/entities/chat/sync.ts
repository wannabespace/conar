import { createCollection, inArray, queryOnce } from '@tanstack/react-db'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { db, waitForMigrations } from '~/drizzle'
import { chats, chatsMessages } from '~/drizzle/schema'
import { connectionsCollection } from '~/entities/connection/sync'
import { isSignedIn } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

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
    if (!navigator.onLine || !await isSignedIn()) {
      return
    }

    await connectionsCollection.utils.waitForSync()
    const sync = await orpc.chats.sync.call(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        const { type, value: { connectionResourceId, ...value } } = item

        if (connectionResourceId) {
          write({
            type,
            value: {
              ...value,
              connectionResourceId,
            },
          })
        }
      }
    })
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chats.create.call(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chats.update.call({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.chats.remove.call(mutations.map(m => ({ id: m.key })))
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
    if (!navigator.onLine || !await isSignedIn()) {
      return
    }

    await chatsCollection.utils.waitForSync()
    const sync = await orpc.chatsMessages.sync.call(collection.toArray.map(m => ({ id: m.id, updatedAt: m.updatedAt })))
    const chats = await queryOnce(q => q
      .from({ chats: chatsCollection })
      .where(({ chats }) => inArray(chats.id, sync.filter(m => m.type === 'insert' || m.type === 'update').map(m => m.value.chatId)))
      .select(({ chats }) => ({ id: chats.id })))
    const chatsIds = chats.map(c => c.id)

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        if (chatsIds.includes(item.value.chatId)) {
          write(item)
        }
      }
    })
  },
  onInsert: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chatsMessages.create.call(m.modified)))
  },
  onUpdate: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await Promise.all(mutations.map(m => orpc.chatsMessages.update.call({ id: m.key, ...m.changes })))
  },
  onDelete: async ({ transaction }) => {
    const mutations = transaction.mutations.filter(m => (m.metadata as ChatMessagesMutationMetadata)?.cloudSync !== false)

    if (mutations.length === 0) {
      return
    }

    await orpc.chatsMessages.remove.call(mutations.map(m => ({ id: m.key, chatId: m.modified.chatId })))
  },
}))
