import { ANONYMOUS_MAX_CONNECTIONS } from '@conar/shared/constants'
import { SyncType } from '@conar/shared/enums/sync-type'
import { isAnonymousUser } from '@conar/shared/utils/auth'
import { encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { ORPCError } from '@orpc/server'
import { count, eq } from 'drizzle-orm'
import { connections, connectionsInsertSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(connectionsInsertSchema.omit('userId'))
  .handler(async ({ context, input }) => {
    if (isAnonymousUser(context.user)) {
      if (
        input.syncType === SyncType.Cloud
        || input.syncType === SyncType.CloudWithoutPassword
      ) {
        throw new ORPCError('FORBIDDEN', { message: 'Cloud sync requires sign in.' })
      }

      const [row] = await db
        .select({ count: count() })
        .from(connections)
        .where(eq(connections.userId, context.user.id))

      const existingCount = Number(row?.count ?? 0)
      if (existingCount >= ANONYMOUS_MAX_CONNECTIONS) {
        throw new ORPCError('FORBIDDEN', { message: 'Sign in to add more connections.' })
      }
    }

    const newConnectionString = new SafeURL(input.connectionString)

    if (input.syncType === SyncType.CloudWithoutPassword) {
      newConnectionString.password = ''
    }

    await db.insert(connections).values({
      ...input,
      connectionString: encrypt({ text: newConnectionString.toString(), secret: await context.getUserSecret() }),
      userId: context.user.id,
    })
  })
