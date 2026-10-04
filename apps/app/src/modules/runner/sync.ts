import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { persistence } from '~/lib/database'
import { orpc } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import { PERSISTED_SCHEMA_VERSION, syncCollectionOptions } from '~/lib/sync'

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
            undefined,
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'queries',
        mutations: {
          delete: (id) => orpc.queries.remove.call({ id }),
          insert: (value) => orpc.queries.create.call(value),
          update: (id, { name }) => orpc.queries.update.call({ id, name }),
        },
        sync: ({ rows, signal }) => orpc.queries.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: PERSISTED_SCHEMA_VERSION,
    })
  )
