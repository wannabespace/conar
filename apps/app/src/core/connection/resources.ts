import { getCollections } from '~/core/collections'

export const findResource = (connectionId: string, name: string | null) =>
  getCollections().connectionsResourcesCollection.toArray.find(
    (resource) =>
      resource.connectionId === connectionId && resource.name === name
  )
