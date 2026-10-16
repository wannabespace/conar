import { describeConnectionString } from '@tamery/connection/utils'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import { createConnection } from '~/core/connection/save'
import { useActiveWorkspace } from '~/core/workspace/hooks'
import { posthog } from '~/lib/posthog'
import type { OnSave } from '~/modules/connection-form/lib/use-test-then-save'

export const useCreateConnection = (): OnSave => {
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

    await (open
      ? router.navigate({
          params: { resourceId },
          to: '/connection/$resourceId',
        })
      : router.navigate({ to: '/' }))
    posthog.capture('connection_created', {
      origin: origin ?? 'form',
      ssh: describeConnectionString(connection.connectionString).usesSsh,
      syncType,
      type: connection.type,
    })
    toast.success('Connection created')
  }
}
