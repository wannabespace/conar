import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { connections, connectionsUpdateSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type.and(
    connectionsUpdateSchema.omit('createdAt', 'updatedAt', 'userId', 'id'),
    connectionsUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input
    const [connection] = await db.select().from(connections).where(eq(connections.id, id)).limit(1)

    if (!connection) {
      throw new ORPCError('NOT_FOUND', { message: 'Connection not found' })
    }

    const secret = await context.getUserSecret()

    const newConnectionString = new SafeURL(
      changes.connectionString
      ?? decrypt({ encryptedText: connection.connectionString, secret }),
    )

    if ((changes.syncType ?? connection.syncType) !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    await db
      .update(connections)
      .set({
        ...changes,
        connectionString: encrypt({ text: newConnectionString.toString(), secret }),
      })
      .where(and(eq(connections.id, id), eq(connections.userId, context.user.id)))
  })
