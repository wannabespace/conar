import { decrypt, encrypt } from '@conar/shared/encryption'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { ORPCError } from '@orpc/server'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { databases, databasesUpdateSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const update = orpc
  .use(authMiddleware)
  .input(type.and(
    databasesUpdateSchema.omit('userId', 'id'),
    databasesUpdateSchema.pick('id').required(),
  ))
  .handler(async ({ context, input }) => {
    const { id, ...changes } = input
    const [database] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

    if (!database) {
      throw new ORPCError('NOT_FOUND', { message: 'Database not found' })
    }

    if (database.userId !== context.user.id) {
      throw new ORPCError('UNAUTHORIZED')
    }

    const newConnectionString = new SafeURL(
      changes.connectionString
      ?? decrypt({ encryptedText: database.connectionString, secret: context.user.secret }),
    )

    if ((changes.syncType ?? database.syncType) !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    await db
      .update(databases)
      .set({
        ...changes,
        connectionString: encrypt({ text: newConnectionString.toString(), secret: context.user.secret }),
      })
      .where(eq(databases.id, id))
  })
