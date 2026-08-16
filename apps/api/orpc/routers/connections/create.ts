import { db } from '@tamery/db'
import { connections, connectionsInsertSchema } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { encrypt } from '@tamery/shared/utils/crypto-node'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { type } from 'arktype'

import { ensureDefaultWorkspace, memberWorkspaceIds } from '~/lib/workspace'
import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const create = orpc
  .use(authMiddleware)
  .input(
    connectionsInsertSchema
      .omit('userId', 'workspaceId')
      .and(type({ 'workspaceId?': 'string | null' }))
  )
  .handler(async ({ context, input }) => {
    // The client sends the workspace that was active on the device; it is
    // membership-checked, and anything else falls back to the default workspace.
    const allowedWorkspaceIds = await memberWorkspaceIds(
      context.user.id,
      typeof input.workspaceId === 'string' ? [input.workspaceId] : []
    )
    const workspaceId =
      input.workspaceId && allowedWorkspaceIds.has(input.workspaceId)
        ? input.workspaceId
        : await ensureDefaultWorkspace(context.user.id)
    const workspaceSecret = await context.getWorkspaceSecret(workspaceId)

    const connectionString = new SafeURL(input.connectionString)

    if (input.syncType !== SyncType.Cloud) {
      connectionString.password = ''
    }

    const [inserted] = await db
      .insert(connections)
      .values({
        ...input,
        connectionString: encrypt({
          secret: workspaceSecret,
          text: connectionString.toString(),
        }),
        userId: context.user.id,
        workspaceId,
      })
      .returning()

    if (!inserted) {
      throw new Error('Failed to create connection')
    }

    publisher.publish(context.user.id, {
      type: 'insert',
      value: inserted,
    })
  })
