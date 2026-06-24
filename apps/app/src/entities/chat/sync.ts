import type { AppUIMessage } from '@conar/ai/tools/helpers'
import type { ORPCOutputs } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

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
  return createCollection(persistedCollectionOptions<Chat, string>({
    id: 'chats',
    persistence,
    autoIndex: 'eager',
    gcTime: 0,
    defaultIndexType: BasicIndex,
    schemaVersion: 1,
    getKey: item => item.id,
    sync: {
      sync: ({ begin, commit, write, collection, markReady }) => {
        const abortController = new AbortController()

        const writeItem = (item: ORPCOutputs['chats']['sync'][number]) => {
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
                connectionResourceId: item.value.connectionResourceId,
              },
            })
          }
        }

        orpc.chats.events.call({}, {
          signal: abortController.signal,
        })
          .then(async (events) => {
            if (abortController.signal.aborted)
              return
            markReady()
            for await (const item of events) {
              if (abortController.signal.aborted)
                break
              begin()
              writeItem(item)
              commit()
            }
          })
          .catch(() => {
            if (!abortController.signal.aborted)
              markReady()
          })

        collection.toArrayWhenReady().then(async (rows) => {
          const sync = await orpc.chats.sync.call(
            rows,
            { signal: abortController.signal },
          )
          if (abortController.signal.aborted)
            return
          begin()
          for (const item of sync) {
            writeItem(item)
          }
          commit()
        })

        return () => {
          abortController.abort('chats sync aborted')
        }
      },
    },
    onInsert: async ({ transaction }) => {
      await orpc.chats.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map(m => orpc.chats.update.call({ id: m.key, ...m.changes })))
    },
    onDelete: async ({ transaction }) => {
      await orpc.chats.remove.call(transaction.mutations.map(m => ({ id: m.key })))
    },
  }))
}

export function createChatsMessagesCollection() {
  return createCollection(persistedCollectionOptions<ChatMessage, string>({
    id: 'chatsMessages',
    persistence,
    autoIndex: 'eager',
    gcTime: 0,
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
        })
          .then(async (events) => {
            if (abortController.signal.aborted)
              return
            markReady()
            for await (const item of events) {
              if (abortController.signal.aborted)
                break
              begin()
              writeItem(item)
              commit()
            }
          })
          .catch(() => {
            if (!abortController.signal.aborted)
              markReady()
          })

        collection.toArrayWhenReady().then(async (rows) => {
          const sync = await orpc.chatsMessages.sync.call(
            rows,
            { signal: abortController.signal },
          )
          if (abortController.signal.aborted)
            return
          begin()
          for (const item of sync) {
            writeItem(item)
          }
          commit()
        })

        return () => {
          abortController.abort('chatsMessages sync aborted')
        }
      },
    },
    onInsert: async ({ transaction }) => {
      await orpc.chatsMessages.create.call(transaction.mutations.map(m => m.modified))
    },
    onUpdate: async ({ transaction }) => {
      await Promise.all(transaction.mutations.map(m => orpc.chatsMessages.update.call({ id: m.key, ...m.changes })))
    },
    onDelete: async ({ transaction }) => {
      await orpc.chatsMessages.remove.call(transaction.mutations.map(m => ({ id: m.key, chatId: m.modified.chatId })))
    },
  }))
}
