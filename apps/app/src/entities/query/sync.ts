import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { orpc } from '~/lib/orpc'
import type { BaseTable, SyncUtils } from '~/lib/sync'
import { persistence, syncCollectionOptions } from '~/lib/sync'

export interface Query extends BaseTable {
  connectionResourceId: string
  name: string
  query: string
}

export function createQueriesCollection() {
  return createCollection(
    persistedCollectionOptions<Query, string, never, SyncUtils>({
      ...syncCollectionOptions<Query>({
        id: 'queries',
        getKey: item => item.id,
        events: async ({ signal, write }) => {
          for await (const message of await orpc.queries.events.call({}, { signal })) {
            write(message)
          }
        },
        sync: ({ rows, signal }) => orpc.queries.sync.call(rows, { signal }),
        onInsert: async ({ transaction }) => {
          await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
        },
        onDelete: async ({ transaction }) => {
          await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
        },
      }),
      persistence,
      schemaVersion: 1,
    }),
  )
}
