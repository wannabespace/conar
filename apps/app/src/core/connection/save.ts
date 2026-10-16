import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { SyncType } from '@tamery/shared/enums/sync-type'
import { silently } from '@tamery/shared/utils'
import { Result } from 'better-result'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import type {
  ConnectionString,
  ConnectionStringInput,
} from '~/core/connection/connection-strings'
import { findResource, insertResource } from '~/core/connection/resources'
import { rememberOpenedResource } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'

export interface ConnectionDetails {
  color?: string | null
  connectionString: string
  label?: string | null
  name: string
  type: ConnectionType
}

/** Leaves a newer write in place; two queued saves that both fail keep the first one's string (accepted edge). */
const rollback = async (
  failed: ConnectionString,
  string: ConnectionStringInput | null
) => {
  const { connectionStringsCollection } = getCollections()
  const isCurrent = () =>
    connectionStringsCollection.get(failed.connectionId)?.encrypted ===
    failed.encrypted
  if (!string) {
    if (isCurrent()) {
      connectionStringsCollection.delete(failed.connectionId)
    }
    return
  }
  const { write } = await connectionStringsCollection.utils.prepare(string)
  if (isCurrent()) {
    write()
  }
}

export const saveConnectionString = async ({
  connectionString,
  connectionId,
  updatedAt,
  writeRow,
}: ConnectionStringInput & {
  /** Joins the offline transaction that inserts the string's resource. */
  writeRow?: (isPasswordExists: boolean) => void
}) => {
  const { connectionsCollection, connectionStringsCollection } =
    getCollections()
  const { previous, record, write } =
    await connectionStringsCollection.utils.prepare({
      connectionId,
      connectionString,
      updatedAt,
    })
  const stored = connectionStringsCollection.get(connectionId)
  const resource = record.defaultResourceName || null
  const existingResource = findResource(connectionId, resource)
  const resourceId = existingResource?.id ?? v7()

  const tx = mutateOffline(() => {
    if (writeRow) {
      // An empty password on a device that never had it means "not known here", not "none": clearing the flag would stop every device asking for it.
      writeRow(
        record.isPasswordPopulated ||
          (!stored?.isPasswordPopulated &&
            !!connectionsCollection.get(connectionId)?.isPasswordExists)
      )
    }
    if (!existingResource) {
      insertResource(connectionId, resourceId, resource)
    }
  })
  write()

  const settle = async () => {
    const persisted = await Result.tryPromise(() => tx.isPersisted.promise)
    if (persisted.isOk()) {
      if (resource && resource !== stored?.defaultResourceName) {
        rememberOpenedResource(connectionId, resource)
      }
    } else {
      await silently(() => rollback(record, previous))
    }
    return persisted
  }

  return { resource, resourceId, settled: settle() }
}

const saveConnection = async (
  connectionId: string,
  { connectionString, ...details }: ConnectionDetails,
  writeRow: (
    row: Omit<Connection, 'createdAt' | 'id' | 'syncType' | 'workspaceId'>
  ) => void
) => {
  const updatedAt = new Date()
  const saved = await saveConnectionString({
    connectionId,
    connectionString: connectionString.trim(),
    updatedAt,
    writeRow: (isPasswordExists) =>
      writeRow({
        color: details.color || null,
        isPasswordExists,
        label: details.label || null,
        name: details.name,
        type: details.type,
        updatedAt,
      }),
  })
  // The web can query through the server, which must hold the row and its resource before the connection opens.
  if (!window.electron && navigator.onLine) {
    const persisted = await saved.settled
    if (persisted.isErr()) {
      throw persisted.error.cause
    }
  }
  return saved
}

export const createConnection = async ({
  syncType,
  workspaceId,
  ...details
}: ConnectionDetails & { syncType: SyncType; workspaceId: string }) => {
  const id = v7()
  const { resourceId } = await saveConnection(id, details, (row) => {
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
