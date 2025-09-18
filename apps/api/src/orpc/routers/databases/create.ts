import { encrypt } from '@conar/shared/encryption'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { databases, databasesInsertSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(databasesInsertSchema
    .omit('userId', 'syncType')
    .and(databasesInsertSchema.pick('syncType').partial()))
  .handler(async ({ context, input }) => {
    const syncType = input.syncType ?? (!input.isPasswordExists || (input.isPasswordExists && new SafeURL(input.connectionString).password)
      ? SyncType.Cloud
      : SyncType.CloudWithoutPassword)
    const newConnectionString = new SafeURL(input.connectionString)

    if (syncType === SyncType.CloudWithoutPassword) {
      newConnectionString.password = ''
    }

    const [database] = await db.insert(databases).values({
      ...input,
      connectionString: encrypt({ text: newConnectionString.toString(), secret: context.user.secret }),
      userId: context.user.id,
      syncType,
    }).returning()

    return {
      ...database!,
      connectionString: newConnectionString.toString(),
    }
  })
