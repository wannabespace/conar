import { SyncType } from '@conar/shared/enums/sync-type'
import { decrypt, encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { and, eq } from 'drizzle-orm'
import { databases, databasesUpdateSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type.and(
    databasesUpdateSchema.omit('createdAt', 'updatedAt', 'userId', 'id'),
    databasesUpdateSchema.pick('id').required(),
  ))
  .output(type({}))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input
    const [database] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

    if (!database) {
      throw new ORPCError('NOT_FOUND', { message: 'Database not found' })
    }

    const secret = await context.getUserSecret()

    const newConnectionString = new SafeURL(
      changes.connectionString
      ?? decrypt({ encryptedText: database.connectionString, secret }),
    )

    if ((changes.syncType ?? database.syncType) !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    await db
      .update(databases)
      .set({
        ...changes,
        connectionString: encrypt({ text: newConnectionString.toString(), secret }),
      })
      .where(and(eq(databases.id, id), eq(databases.userId, context.user.id)))

    return {}
  })
