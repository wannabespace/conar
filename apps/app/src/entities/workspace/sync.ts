import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { orpc } from '~/lib/orpc'
import type { BaseTable, SyncUtils } from '~/lib/sync'
import { persistence, syncCollectionOptions } from '~/lib/sync'

export interface Workspace extends BaseTable {
  name: string
  slug: string
  logo: string | null
  metadata: string | null
}

export const createWorkspacesCollection = () =>
  createCollection(
    persistedCollectionOptions<Workspace, string, never, SyncUtils>({
      ...syncCollectionOptions<Workspace>({
        events: async ({ signal, write }) => {
          for await (const message of await orpc.workspaces.events.call(
            {},
            { signal }
          )) {
            write(message)
          }
        },
        getKey: (item) => item.id,
        id: 'workspaces',
        sync: ({ rows, signal }) => orpc.workspaces.sync.call(rows, { signal }),
      }),
      persistence,
      schemaVersion: 1,
    })
  )
