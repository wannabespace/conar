import type { ORPCOutputs } from '~/lib/orpc'
import { createCollection } from '@tanstack/react-db'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { db, waitForMigrations } from '~/drizzle'
import { chats, chatsMessages } from '~/drizzle/schema'
import { connectionsResourcesCollection } from '~/entities/connection/sync'
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
  sync: {
    sync: async ({ writeAsync, markReady }) => {
      if (!navigator.onLine || !await isSignedIn()) {
        return
      }

      await connectionsResourcesCollection.stateWhenReady()

      const abortController = new AbortController()

      const events = await orpc.chats.events.call({}, {
        signal: abortController.signal,
      })

      const writeItem = async (item: ORPCOutputs['chats']['sync'][number]) => {
        if (item.type === 'delete') {
          await writeAsync(item)
        }
        else if (item.value?.connectionResourceId) {
          await writeAsync({
            type: item.type,
            value: {
              ...item.value,
              connectionResourceId: item.value.connectionResourceId!,
            },
          })
        }
      }

      ;(async () => {
        for await (const item of events) {
          await writeItem(item)
        }
      })()

      const sync = await orpc.chats.sync.call(
        await db.select({ id: chats.id, updatedAt: chats.updatedAt }).from(chats),
        { signal: abortController.signal },
      )

      for (const item of sync) {
        await writeItem(item)
      }

      markReady()

      return () => {
        abortController.abort()
      }
    },
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
  sync: {
    sync: async ({ writeAsync, markReady }) => {
      if (!navigator.onLine || !await isSignedIn()) {
        return
      }

      await chatsCollection.stateWhenReady()

      const abortController = new AbortController()

      const events = await orpc.chatsMessages.events.call({}, {
        signal: abortController.signal,
      })

      ;(async () => {
        for await (const item of events) {
          await writeAsync(item)
        }
      })()

      const sync = await orpc.chatsMessages.sync.call(
        await db.select({ id: chatsMessages.id, updatedAt: chatsMessages.updatedAt }).from(chatsMessages),
        { signal: abortController.signal },
      )

      for (const item of sync) {
        await writeAsync(item)
      }

      markReady()

      return () => {
        abortController.abort()
      }
    },
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
