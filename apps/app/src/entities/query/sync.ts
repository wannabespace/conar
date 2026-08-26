import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { orpc } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { persistence, syncCollectionOptions } from '~/lib/sync'

export interface Query extends BaseTable {
  connectionResourceId: string
  name: string
  query: string
}

export const createQueriesCollection = () =>
  createCollection(
    persistedCollectionOptions({
      ...syncCollectionOptions<Query>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.queries.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'queries',
        onDelete: async ({ transaction }) => {
          await orpc.queries.remove.call(
            transaction.mutations.map((m) => ({ id: m.key }))
          )
        },
        onInsert: async ({ transaction }) => {
          await Promise.all(
            transaction.mutations.map((m) =>
              orpc.queries.create.call(m.modified)
            )
          )
        },
        sync: ({ rows, signal }) => orpc.queries.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )
