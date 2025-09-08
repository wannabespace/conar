import type { MutationOptions } from '@tanstack/react-query'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { eq, inArray } from 'drizzle-orm'
import { chats, chatsMessages, chatsMessagesSelectSchema, chatsSelectSchema, db } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export const chatsCollection = createCollection({
  startSync: true,
  sync: {
    sync: async ({ begin, write, commit, markReady }) => {
      begin()
      const chts = await db.select().from(chats)
      chts.forEach(db => write({ type: 'insert', value: db }))
      commit()
      markReady()
    },
  },
  schema: chatsSelectSchema,
  getKey: chat => chat.id,
  onDelete: async ({ transaction }) => {
    const keys = transaction.mutations.map(mutation => mutation.key)
    if (keys.length > 0) {
      await db.delete(chats).where(inArray(chats.id, keys))
    }
  },
  onInsert: async ({ transaction }) => {
    await db.insert(chats).values(transaction.mutations.map(m => m.modified))
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(mutation =>
      db.update(chats).set(mutation.changes).where(eq(chats.id, mutation.key)),
    ))
  },
})

export const chatsMessagesCollection = createCollection({
  startSync: true,
  sync: {
    sync: async ({ begin, write, commit, markReady }) => {
      begin()
      const chatMsgs = await db.select().from(chatsMessages)
      chatMsgs.forEach(db => write({ type: 'insert', value: db }))
      commit()
      markReady()
    },
  },
  schema: chatsMessagesSelectSchema,
  getKey: message => message.id,
  onDelete: async ({ transaction }) => {
    const keys = transaction.mutations.map(mutation => mutation.key)
    if (keys.length > 0) {
      await db.delete(chatsMessages).where(inArray(chatsMessages.id, keys))
    }
  },
  onInsert: async ({ transaction }) => {
    await db.insert(chatsMessages).values(transaction.mutations.map(m => m.modified) as typeof chatsMessages.$inferInsert[])
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(mutation =>
      db.update(chatsMessages).set(mutation.changes).where(eq(chatsMessages.id, mutation.key)),
    ))
  },
})

async function syncChats() {
  const existing = chatsCollection.toArray
  const iterator = await orpc.sync.chats(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
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
    }
  }
}

async function syncChatsMessages() {
  const existing = chatsMessagesCollection.toArray
  const iterator = await orpc.sync.chatsMessages(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
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
