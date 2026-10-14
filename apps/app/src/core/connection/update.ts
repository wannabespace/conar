import { connectionSecrets } from '@tamery/connection/secrets'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import { getConnectionStore } from '~/core/connection/stores'
import { queryClient } from '~/lib/query-client'

/** Every cached result came from the old host or credentials; the query keys only carry the connection or resource id. */
export const dropConnectionQueries = (connectionId: string) => {
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

export const updateConnection = async (
  connectionId: string,
  data: {
    color?: string | null
    connectionString: string
    label?: string | null
    name: string
    type: ConnectionType
  }
) => {
  const {
    connectionsCollection,
    connectionStringsCollection,
    connectionsResourcesCollection,
  } = getCollections()
  const updatedAt = new Date()
  const previous = connectionStringsCollection.get(connectionId)
  const record = await connectionStringsCollection.utils.prepare({
    connectionId,
    connectionString: connectionSecrets.keepMissing(
      data.connectionString.trim(),
      previous?.missingSecrets ?? []
    ),
    updatedAt,
  })
  // An empty password on a device that never had it means "not known here", not "none": clearing the flag would stop every device asking for it.
  const isPasswordExists =
    record.isPasswordPopulated ||
    (!previous?.isPasswordPopulated &&
      !!connectionsCollection.get(connectionId)?.isPasswordExists)
  const writeString = (value: typeof record) => {
    if (connectionStringsCollection.has(connectionId)) {
      connectionStringsCollection.update(connectionId, (draft) => {
        Object.assign(draft, value)
      })
    } else {
      connectionStringsCollection.insert(value)
    }
    dropConnectionQueries(connectionId)
  }

  writeString(record)

  const resource = record.defaultResourceName
  const isNewResource = !connectionsResourcesCollection.toArray.some(
    (row) => row.connectionId === connectionId && row.name === resource
  )
  if (resource && resource !== previous?.defaultResourceName) {
    getConnectionStore(connectionId).set((state) => ({
      ...state,
      lastOpenedResourceName: resource,
    }))
  }

  const tx = mutateOffline(() => {
    connectionsCollection.update(connectionId, (draft) => {
      Object.assign(draft, {
        color: data.color || null,
        isPasswordExists,
        label: data.label || null,
        name: data.name,
        type: data.type,
        updatedAt,
      })
    })
    if (isNewResource) {
      connectionsResourcesCollection.insert({
        connectionId,
        createdAt: updatedAt,
        id: v7(),
        name: resource,
        updatedAt,
      })
    }
  })
  const restoreStringOnRollback = async () => {
    try {
      await tx.isPersisted.promise
    } catch {
      if (previous) {
        writeString(previous)
      } else {
        connectionStringsCollection.delete(connectionId)
      }
    }
  }
  void restoreStringOnRollback()

  return tx
}
