import { SyncType } from '@conar/shared/enums/sync-type'
import { encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { connections, connectionsInsertSchema, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(connectionsInsertSchema.omit('userId'))
  .handler(async ({ context, input }) => {
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
