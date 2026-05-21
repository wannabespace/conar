import type { AppUIMessage } from '@conar/ai/tools/helpers'
import type { ORPCOutputs } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

export interface ChatMutationMetadata {
  cloudSync?: false
}

export interface Chat extends BaseTable {
  connectionResourceId: string
  title: string | null
}

export const chatsCollection = createCollection(persistedCollectionOptions<Chat, string>({
  id: 'chats',
  persistence,
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  schemaVersion: 1,
  getKey: item => item.id,
  sync: {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()

      const writeItem = async (item: ORPCOutputs['chats']['sync'][number]) => {
        if (item.type === 'delete') {
          write({
            type: item.type,
            key: item.key,
          })
        }
        else if (item.value?.connectionResourceId) {
          write({
            type: item.type,
            value: {
              ...item.value,
              connectionResourceId: item.value.connectionResourceId!,
            },
          })
        }
      }

      orpc.chats.events.call({}, {
        signal: abortController.signal,
      }).then(async (events) => {
        markReady()
        for await (const item of events) {
          begin()
          writeItem(item)
          commit()
        }
      })

      collection.toArrayWhenReady().then(async (rows) => {
        orpc.chats.sync.call(
          rows,
          { signal: abortController.signal },
        )
          .then(async (sync) => {
            begin()
            for (const item of sync) {
              writeItem(item)
            }
            commit()
          })
      })

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

export interface ChatMessage extends BaseTable {
  chatId: string
  parts: AppUIMessage['parts']
  role: AppUIMessage['role']
  metadata: NonNullable<AppUIMessage['metadata']> | null
}

export const chatsMessagesCollection = createCollection(persistedCollectionOptions<ChatMessage, string>({
  id: 'chatsMessages',
  persistence,
  autoIndex: 'eager',
  defaultIndexType: BasicIndex,
  schemaVersion: 1,
  getKey: item => item.id,
  sync: {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()

      const writeItem = (item: ORPCOutputs['chatsMessages']['sync'][number]) => {
        if (item.type === 'delete') {
          write({
            type: 'delete',
            key: item.key,
          })
        }
        else {
          write({
            type: item.type,
            value: item.value,
          })
        }
      }

      orpc.chatsMessages.events.call({}, {
        signal: abortController.signal,
      }).then(async (events) => {
        markReady()
        for await (const item of events) {
          begin()
          writeItem(item)
          commit()
        }
      })

      collection.toArrayWhenReady().then(async (rows) => {
        orpc.chatsMessages.sync.call(
          rows,
          { signal: abortController.signal },
        )
          .then(async (sync) => {
            begin()
            for (const item of sync) {
              writeItem(item)
            }
            commit()
          })
      })

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
