import type { ORPCOutputs } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { BasicIndex, createCollection } from '@tanstack/react-db'
import { orpc } from '~/lib/orpc'
import { persistence } from '~/lib/sync'

export interface Query extends BaseTable {
  connectionResourceId: string
  name: string
  query: string
}

export const queriesCollection = createCollection(persistedCollectionOptions<Query, string>({
  id: 'queries',
  persistence,
  autoIndex: 'eager',
  gcTime: 1,
  defaultIndexType: BasicIndex,
  schemaVersion: 1,
  getKey: item => item.id,
  sync: {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()

      const writeItem = (item: ORPCOutputs['queries']['sync'][number]) => {
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

      orpc.queries.events.call({}, {
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
        const sync = await orpc.queries.sync.call(
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
        abortController.abort('queries sync aborted')
      }
    },
  },
  onInsert: async ({ transaction }) => {
    await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
  },
  onDelete: async ({ transaction }) => {
    await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
  },
}))
