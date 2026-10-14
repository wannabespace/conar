import { connectionSecrets } from '@tamery/connection/secrets'
import { useMutation } from '@tanstack/react-query'
import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import { getConnectionStore } from '~/core/connection/stores'
import { queryClient } from '~/lib/query-client'

import type { SavedConnection } from '../../create/-lib/use-create-connection'

const updateConnection = async (
  connectionId: string,
  data: SavedConnection
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

  if (previous) {
    connectionStringsCollection.update(connectionId, (draft) => {
      Object.assign(draft, record)
    })
  } else {
    connectionStringsCollection.insert(record)
  }

  const resources = connectionsResourcesCollection.toArray.filter(
    (resource) => resource.connectionId === connectionId
  )
  const resource = record.defaultResourceName
  const isNewResource = !resources.some(({ name }) => name === resource)
  if (resource && resource !== previous?.defaultResourceName) {
    getConnectionStore(connectionId).set((state) => ({
      ...state,
      lastOpenedResourceName: resource,
    }))
  }

  const queryIds = new Set<unknown>([
    connectionId,
    ...resources.map(({ id }) => id),
  ])
  queryClient.removeQueries({
    predicate: ({ queryKey: [, id] }) => queryIds.has(id),
  })

  return mutateOffline(() => {
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
}

export const useUpdateConnection = (connectionId: string) => {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return useMutation({
    meta: { event: 'connection_updated' },
    mutationFn: async (data: SavedConnection) => {
      const tx = await updateConnection(connectionId, data)

      if (!window.electron && navigator.onLine) {
        await tx.isPersisted.promise
      }

      if (canGoBack) {
        router.history.back()
      } else {
        await router.navigate({ to: '/' })
      }
      toast.success('Connection saved')
    },
    onError: (error) => {
      toast.error("Couldn't save the connection", {
        description: error.message,
      })
    },
  })
}
