import { decrypt, encrypt } from '@conar/shared/encryption'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { type } from 'arktype'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(type({
    'id?': 'string.uuid.v7',
    'name': 'string > 0',
    'type': type.valueOf(DatabaseType),
    'syncType?': type.valueOf(SyncType),
    'connectionString': 'string > 0',
    'isPasswordExists': 'boolean',
  }))
  .handler(async ({ context, input }) => {
    const [database] = await db.insert(databases).values({
      id: input.id,
      name: input.name,
      type: input.type,
      connectionString: encrypt({ text: input.connectionString, secret: context.user.secret }),
      isPasswordExists: input.isPasswordExists,
      userId: context.user.id,
      syncType: input.syncType ?? (!input.isPasswordExists || (input.isPasswordExists && new SafeURL(input.connectionString).password)
        ? SyncType.Cloud
        : SyncType.CloudWithoutPassword),
    }).returning()

    return {
      ...database!,
      connectionString: decrypt({ encryptedText: database!.connectionString, secret: context.user.secret }),
    }
  })
