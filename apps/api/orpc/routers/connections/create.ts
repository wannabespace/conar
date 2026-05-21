import { db } from '@conar/db'
import { connections, connectionsInsertSchema } from '@conar/db/schema'
import { SyncType } from '@conar/shared/enums/sync-type'
import { encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { authMiddleware, orpc } from '~/orpc'
import { publisher } from './events'

export const create = orpc
  .use(authMiddleware)
  .input(connectionsInsertSchema.omit('userId'))
  .handler(async ({ context, input }) => {
    const newConnectionString = new SafeURL(input.connectionString)

    if (input.syncType !== SyncType.Cloud) {
      newConnectionString.password = ''
    }

    const [connection] = await db.insert(connections).values({
      ...input,
      connectionString: encrypt({ text: newConnectionString.toString(), secret: await context.getUserSecret() }),
      userId: context.user.id,
    }).returning()

    publisher.publish('event', {
      type: 'insert',
      value: {
        ...connection!,
        connectionString: newConnectionString.toString(),
      },
      clientId: context.clientId,
    })
  })
