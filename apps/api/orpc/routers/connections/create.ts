import { db } from '@tamery/db'
import { connections, connectionsInsertSchema } from '@tamery/db/schema'
import { SyncType } from '@tamery/shared/enums/sync-type'
import { encrypt } from '@tamery/shared/utils/crypto-node'
import { SafeURL } from '@tamery/shared/utils/safe-url'
import { type } from 'arktype'

import { authMiddleware, orpc } from '~/orpc'

import { publisher } from './events'

const schema = connectionsInsertSchema.omit('userId')

export const create = orpc
  .use(authMiddleware)
  .input(type.or(schema, schema.array()).pipe(data => (Array.isArray(data) ? data : [data])))
  .handler(async ({ context, input }) => {
    const userSecret = await context.getUserSecret()

    const inserted = await db
      .insert(connections)
      .values(
        await Promise.all(
          input.map(async item => {
            const newConnectionString = new SafeURL(item.connectionString)

            if (item.syncType !== SyncType.Cloud) {
              newConnectionString.password = ''
            }

            return {
              ...item,
              connectionString: encrypt({
                text: newConnectionString.toString(),
                secret: userSecret,
              }),
              userId: context.user.id,
            }
          }),
        ),
      )
      .returning()

    for (const connection of inserted) {
      publisher.publish(context.user.id, {
        type: 'insert',
        value: connection,
      })
    }
  })
