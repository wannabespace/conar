import { db } from '@tamery/db'
import { connections, connectionsUpdateSchema } from '@tamery/db/schema'
import { GUEST_SYNC_MESSAGE } from '@tamery/shared/constants'
import { decrypt } from '@tamery/shared/crypto-node'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { orpc, permissionsMiddleware } from '~/orpc'

import { encryptConnectionString } from './create'
import { publisher } from './events'

export const update = orpc
  .use(permissionsMiddleware)
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
    FORBIDDEN: { message: GUEST_SYNC_MESSAGE },
    NOT_FOUND: { message: 'Connection not found' },
  })
  .handler(async ({ context, errors, input }) => {
    const { id, ...changes } = input

    if (
      !context.permissions.check('connection.syncString') &&
      changes.syncType &&
      changes.syncType !== SyncType.CloudWithoutConnectionString
    ) {
      throw errors.FORBIDDEN()
    }

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

    const connectionString =
      changes.connectionString ??
      (found.connectionString &&
        decrypt({ encryptedText: found.connectionString, secret }))

    const [connection] = await db
      .update(connections)
      .set({
        ...changes,
        connectionString: encryptConnectionString({
          connectionString,
          secret,
          syncType: changes.syncType ?? found.syncType,
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
