import { connectionSecrets } from '@tamery/connection/secrets'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import type { ConnectionStringInput } from '~/core/connection/connection-strings'
import { ensureResource } from '~/core/connection/resources'
import { getConnectionStore } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'
import { queryClient } from '~/lib/query-client'

/** Every cached result came from the old host or credentials; the query keys only carry the connection or resource id. */
const dropConnectionQueries = (connectionId: string) => {
  const ids = new Set<unknown>([
    connectionId,
    ...getCollections()
      .connectionsResourcesCollection.toArray.filter(
        (resource) => resource.connectionId === connectionId
      )
      .map(({ id }) => id),
  ])
  queryClient.removeQueries({
    predicate: ({ queryKey: [, id] }) => ids.has(id),
  })
}

export const writeConnectionString = async (data: ConnectionStringInput) => {
  const saved =
    await getCollections().connectionStringsCollection.utils.save(data)
  if (saved.changed) {
    dropConnectionQueries(data.connectionId)
  }
  return saved
}

interface ConnectionDetails {
  color?: string | null
  connectionString: string
  label?: string | null
  name: string
  type: ConnectionType
}

const saveConnection = async (
  connectionId: string,
  { connectionString, ...details }: ConnectionDetails,
  writeRow: (
    row: Pick<
      Connection,
      'color' | 'isPasswordExists' | 'label' | 'name' | 'type' | 'updatedAt'
    >
  ) => void
) => {
  const { connectionsCollection, connectionStringsCollection } =
    getCollections()
  const stored = connectionStringsCollection.get(connectionId)
  const updatedAt = new Date()
  const { previous, record } = await writeConnectionString({
    connectionId,
    connectionString: stored
      ? connectionSecrets.keepMissing(
          connectionString.trim(),
          stored.missingSecrets
        )
      : connectionString.trim(),
    updatedAt,
  })
  // An empty password on a device that never had it means "not known here", not "none": clearing the flag would stop every device asking for it.
  const isPasswordExists =
    record.isPasswordPopulated ||
    (!stored?.isPasswordPopulated &&
      !!connectionsCollection.get(connectionId)?.isPasswordExists)
  const resource = record.defaultResourceName || null

  let resourceId = ''
  const tx = mutateOffline(() => {
    writeRow({
      color: details.color || null,
      isPasswordExists,
      label: details.label || null,
      name: details.name,
      type: details.type,
      updatedAt,
    })
    resourceId = ensureResource(connectionId, resource)
  })
  const settle = async () => {
    const { error } = await tryCatchAsync(() => tx.isPersisted.promise)
    if (error) {
      if (previous) {
        await writeConnectionString(previous)
      } else {
        connectionStringsCollection.delete(connectionId)
      }
    } else if (resource && resource !== stored?.defaultResourceName) {
      getConnectionStore(connectionId).set((state) => ({
        ...state,
        lastOpenedResourceName: resource,
      }))
    }
  }
  void settle()

  if (!window.electron && navigator.onLine) {
    await tx.isPersisted.promise
  }

  return resourceId
}

export const createConnection = async ({
  syncType,
  workspaceId,
  ...details
}: ConnectionDetails & { syncType: SyncType; workspaceId: string }) => {
  const id = v7()
  const resourceId = await saveConnection(id, details, (row) => {
    getCollections().connectionsCollection.insert({
      ...row,
      createdAt: row.updatedAt,
      id,
      syncType,
      workspaceId,
    })
  })
  return { id, resourceId }
}

export const updateConnection = (
  connectionId: string,
  details: ConnectionDetails
) =>
  saveConnection(connectionId, details, (row) => {
    getCollections().connectionsCollection.update(connectionId, (draft) => {
      Object.assign(draft, row)
    })
  })
