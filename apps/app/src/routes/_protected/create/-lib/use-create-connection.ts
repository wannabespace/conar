import { isSshConnectionString } from '@tamery/connection/utils'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useCollections } from '~/core/collections'
import { prefetchConnectionResourceCore } from '~/core/connection/fetching'
import { createConnection } from '~/core/connection/save'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { posthog } from '~/lib/posthog'
import type { Persist } from '~/modules/connection-form/lib/use-save-connection'

export const useCreateConnection = (): Persist => {
  const collections = useCollections()
  const { data: activeWorkspace } = useActiveWorkspace()
  const router = useRouter()

  return async (connection, { open, origin, syncType }) => {
    if (!activeWorkspace) {
      throw new Error('Workspace is still loading. Please try again.')
    }

    const { resourceId } = await createConnection({
      ...connection,
      syncType,
      workspaceId: activeWorkspace.id,
    })

    if (open) {
      const createdResource =
        collections.connectionsResourcesCollection.get(resourceId)
      if (!createdResource) {
        throw new Error('Connection resource not found after create')
      }
      prefetchConnectionResourceCore(createdResource)
      await router.navigate({
        params: { resourceId },
        to: '/connection/$resourceId',
      })
    } else {
      await router.navigate({ to: '/' })
    }
    posthog.capture('connection_created', {
      origin: origin ?? 'form',
      ssh: isSshConnectionString(connection.connectionString),
      syncType,
      type: connection.type,
    })
    toast.success('Connection created')
  }
}
