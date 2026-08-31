import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'

import { getCollections } from '~/entities/collections'
import { orpc } from '~/lib/orpc'
import type { BaseTable } from '~/lib/sync'
import {
  PERSISTED_SCHEMA_VERSION,
  persistence,
  syncCollectionOptions,
} from '~/lib/sync'

import { setActiveWorkspace } from './utils'

export interface Workspace extends BaseTable {
  name: string
  slug: string
  logo: string | null
  metadata: string | null
}

export const createWorkspacesCollection = () =>
  createCollection(
    persistedCollectionOptions({
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
      schemaVersion: PERSISTED_SCHEMA_VERSION,
    })
  )

export const createWorkspace = async (name: string) => {
  const { workspacesCollection } = getCollections()

  const workspace = await orpc.workspaces.create.call({ name })

  await workspacesCollection.utils.awaitChange(
    workspace.id,
    workspace.updatedAt
  )

  setActiveWorkspace(workspace.id)

  return workspace
}
