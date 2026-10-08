import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { SafeURL } from '@tamery/shared/safe-url'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import { getConnectionStore } from '~/core/connection/stores'

export const createConnection = async (data: {
  connectionString: string
  name: string
  type: ConnectionType
  syncType: SyncType
  label: string | null
  color: string | null
  workspaceId: string
}) => {
  const id = v7()
  const url = new SafeURL(data.connectionString.trim())

  const resource =
    url.pathname === '/' || url.pathname === '' ? null : url.pathname.slice(1)
  const resourceId = v7()
  const updatedAt = new Date()
  const createdAt = new Date()
  const {
    connectionsCollection,
    connectionStringsCollection,
    connectionsResourcesCollection,
  } = getCollections()

  connectionStringsCollection.insert(
    await connectionStringsCollection.utils.prepare({
      connectionId: id,
      connectionString: url.toString(),
      updatedAt,
    })
  )
  const tx = mutateOffline(() => {
    connectionsCollection.insert({
      color: data.color || null,
      createdAt,
      id,
      isPasswordExists: !!url.password,
      label: data.label || null,
      name: data.name,
      syncType: data.syncType,
      type: data.type,
      updatedAt,
      workspaceId: data.workspaceId,
    })
    connectionsResourcesCollection.insert({
      connectionId: id,
      createdAt,
      id: resourceId,
      name: resource,
      updatedAt,
    })
  })
  const dropStringOnRollback = async () => {
    try {
      await tx.isPersisted.promise
    } catch {
      connectionStringsCollection.delete(id)
    }
  }
  void dropStringOnRollback()

  if (resource) {
    getConnectionStore(id).set((state) => ({
      ...state,
      lastOpenedResourceName: resource,
    }))
  }

  return { id, resourceId, tx }
}
