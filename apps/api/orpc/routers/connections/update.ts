import { db } from '@tamery/db'
import { connections, connectionsUpdateSchema } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { decrypt, encrypt } from '@tamery/shared/utils/crypto-node'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const update = orpc
  .use(authMiddleware)
  .input(
    type.and(
      connectionsUpdateSchema.omit(
        'createdAt',
        'updatedAt',
        'userId',
        'workspaceId',
        'id'
      ),
      connectionsUpdateSchema.pick('id').required()
    )
  )
  .errors({
    NOT_FOUND: { message: 'Connection not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const { id, ...changes } = input
    const [found] = await db
      .select()
      .from(connections)
      .where(
        and(eq(connections.id, id), eq(connections.userId, context.user.id))
      )
      .limit(1)

    if (!found) {
      throw errors.NOT_FOUND()
    }

    const secret = await context.getWorkspaceSecret(found.workspaceId)

    const newConnectionString = new SafeURL(
      changes.connectionString ??
        decrypt({ encryptedText: found.connectionString, secret })
    )

    if ((changes.syncType ?? found.syncType) !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    const [connection] = await db
      .update(connections)
      .set({
        ...changes,
        connectionString: encrypt({
          secret,
          text: newConnectionString.toString(),
        }),
      })
      .where(
        and(eq(connections.userId, context.user.id), eq(connections.id, id))
      )
      .returning()

    if (!connection) {
      throw errors.NOT_FOUND()
    }

    publisher.publish(context.user.id, {
      type: 'update',
      value: connection,
    })
  })
