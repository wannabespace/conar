import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence'
import { createCollection } from '@tanstack/react-db'
import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { getCollections } from '~/entities/collections'
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

export const activeWorkspaceIdStorageValue = createWebStorageValue({
  defaultValue: null,
  key: 'tamery.active-workspace-id',
  schema: type('string | null'),
  type: 'localStorage',
})

export const setActiveWorkspace = (workspaceId: string) => {
  activeWorkspaceIdStorageValue.set(workspaceId)
}

export const createWorkspace = async (name: string) => {
  const { workspacesCollection } = getCollections()

  const workspace = await orpc.workspaces.create.call({ name })

  setActiveWorkspace(workspace.id)

  await workspacesCollection.utils.awaitChange(
    workspace.id,
    new Date(workspace.updatedAt)
  )

  return workspace
}
