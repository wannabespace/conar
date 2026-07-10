import { db } from '@conar/db'
import { connections, connectionsUpdateSchema } from '@conar/db/schema'
import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt, encrypt } from '@conar/shared/utils/crypto-node'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

export const update = orpc
  .use(authMiddleware)
  .input(
    type.and(
      connectionsUpdateSchema.omit('createdAt', 'updatedAt', 'userId', 'id'),
      connectionsUpdateSchema.pick('id').required(),
    ),
  )
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input
    const [found] = await db
      .select()
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, context.user.id)))
      .limit(1)

    if (!found) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    const secret = await context.getUserSecret()

    const newConnectionString = new SafeURL(
      changes.connectionString ?? decrypt({ encryptedText: found.connectionString, secret }),
    )

    if ((changes.syncType ?? found.syncType) !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    const [connection] = await db
      .update(connections)
      .set({
        ...changes,
        connectionString: encrypt({ text: newConnectionString.toString(), secret }),
      })
      .where(and(eq(connections.userId, context.user.id), eq(connections.id, id)))
      .returning()

    publisher.publish(context.user.id, {
      type: 'update',
      value: connection!,
    })
  })
