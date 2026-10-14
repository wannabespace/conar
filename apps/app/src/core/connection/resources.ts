import { v7 } from 'uuid'

import { getCollections } from '~/core/collections'

export const findResource = (connectionId: string, name: string | null) =>
  getCollections().connectionsResourcesCollection.toArray.find(
    (resource) =>
      resource.connectionId === connectionId && resource.name === name
  )

/** Call inside `mutateOffline`: the insert joins the caller's transaction and rolls back with it. */
export const ensureResource = (connectionId: string, name: string | null) => {
  const existing = findResource(connectionId, name)
  if (existing) {
    return existing.id
  }
  const id = v7()
  const now = new Date()
  getCollections().connectionsResourcesCollection.insert({
    connectionId,
    createdAt: now,
    id,
    name,
    updatedAt: now,
  })
  return id
}
