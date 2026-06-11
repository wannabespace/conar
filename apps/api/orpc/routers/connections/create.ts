import { db } from '@conar/db'
import { connections, connectionsInsertSchema } from '@conar/db/schema'
import { SyncType } from '@conar/shared/enums/sync-type'
import { encrypt } from '@conar/shared/utils/encryption'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { type } from 'arktype'
import { generateTxId } from '~/lib/electric'
import { authMiddleware, orpc } from '~/orpc'

const schema = connectionsInsertSchema.omit('userId')

export const create = orpc
  .use(authMiddleware)
  .input(type.or(
    schema,
    schema.array(),
  ).pipe(data => Array.isArray(data) ? data : [data]))
  .handler(async ({ context, input }) => {
    const userSecret = await context.getUserSecret()

    return db.transaction(async (tx) => {
      await tx.insert(connections).values(await Promise.all(input.map(async (item) => {
        const newConnectionString = new SafeURL(item.connectionString)

        if (item.syncType !== SyncType.Cloud) {
          newConnectionString.password = ''
        }

        return {
          ...item,
          connectionString: encrypt({ text: newConnectionString.toString(), secret: userSecret }),
          userId: context.user.id,
        }
      })))

      return { txid: await generateTxId(tx) }
    })
  })
