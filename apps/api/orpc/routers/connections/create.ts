import { db } from '@tamery/db'
import { connections, connectionsInsertSchema } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { encrypt } from '@tamery/shared/utils/crypto-node'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { type } from 'arktype'

import { ensureDefaultWorkspace, memberWorkspaceIds } from '~/lib/workspace'
import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const schema = connectionsInsertSchema.omit('userId')

export const create = orpc
  .use(authMiddleware)
  .input(
    type
      .or(schema, schema.array())
      .pipe((data) => (Array.isArray(data) ? data : [data]))
  )
  .handler(async ({ context, input }) => {
    const userSecret = await context.getUserSecret()
    const fallbackWorkspaceId =
      context.session.activeOrganizationId ??
      (await ensureDefaultWorkspace(context.user.id))
    // A connection created offline carries the workspace that was active on the
    // device, which can differ from the workspace the session points at now.
    const allowedWorkspaceIds = await memberWorkspaceIds(
      context.user.id,
      input
        .map((item) => item.workspaceId)
        .filter((id): id is string => typeof id === 'string')
    )
    const workspaceIdFor = (workspaceId: string | null | undefined) =>
      workspaceId && allowedWorkspaceIds.has(workspaceId)
        ? workspaceId
        : fallbackWorkspaceId

    const inserted = await db
      .insert(connections)
      .values(
        await Promise.all(
          input.map((item) => {
            const newConnectionString = new SafeURL(item.connectionString)

            if (item.syncType !== SyncType.Cloud) {
              newConnectionString.password = ''
            }

            return {
              ...item,
              connectionString: encrypt({
                secret: userSecret,
                text: newConnectionString.toString(),
              }),
              userId: context.user.id,
              workspaceId: workspaceIdFor(item.workspaceId),
            }
          })
        )
      )
      .returning()

    for (const connection of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: connection,
      })
    }
  })
