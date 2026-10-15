import type {
  ConnectionFlavor,
  ConnectionType,
} from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { tryCatchAsync } from '@tamery/shared/utils'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import { ensureResource } from '~/core/connection/resources'
import { rememberOpenedResource } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'

export interface ConnectionDetails {
  color?: string | null
  connectionString: string
  flavor: ConnectionFlavor | null
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
      | 'color'
      | 'flavor'
      | 'isPasswordExists'
      | 'label'
      | 'name'
      | 'type'
      | 'updatedAt'
    >
  ) => void
) => {
  const { connectionsCollection, connectionStringsCollection } =
    getCollections()
  const stored = connectionStringsCollection.get(connectionId)
  const updatedAt = new Date()
  const { previous, record } = await connectionStringsCollection.utils.save({
    connectionId,
    connectionString: connectionString.trim(),
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
      flavor: details.flavor,
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
        await connectionStringsCollection.utils.save(previous)
      } else {
        connectionStringsCollection.delete(connectionId)
      }
    } else if (resource && resource !== stored?.defaultResourceName) {
      rememberOpenedResource(connectionId, resource)
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
