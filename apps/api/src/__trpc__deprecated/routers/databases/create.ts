import { encrypt } from '@conar/shared/encryption'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { SyncType } from '@conar/shared/enums/sync-type'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { TRPCError } from '@trpc/server'
import { type } from 'arktype'
import { protectedProcedure } from '~/__trpc__deprecated'
import { databases, db } from '~/drizzle'

export const create = protectedProcedure
  .input(type({
    name: 'string > 0',
    type: type.valueOf(DatabaseType),
    connectionString: 'string > 0',
    isPasswordExists: 'boolean',
  }))
  .mutation(async ({ input, ctx }) => {
    const user = await db.query.users.findFirst({
      columns: {
        secret: true,
      },
      where: (table, { eq }) => eq(table.id, ctx.user.id),
    })

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'We could not find your user. Please sign in again.' })
    }

    const [connection] = await db.insert(databases).values({
      name: input.name,
      type: input.type,
      connectionString: encrypt({ text: input.connectionString, secret: user.secret }),
      isPasswordExists: input.isPasswordExists,
      userId: ctx.user.id,
      syncType: !input.isPasswordExists || (input.isPasswordExists && new SafeURL(input.connectionString).password)
        ? SyncType.Cloud
        : SyncType.CloudWithoutPassword,
      // @ts-expect-error - idk
    }).returning({ id: databases.id })

    return connection
  })
