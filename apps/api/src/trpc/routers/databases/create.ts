import { encrypt } from '@connnect/shared/encryption'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { type } from 'arktype'
import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const create = protectedProcedure
  .input(type({
    name: 'string > 1',
    type: type.valueOf(DatabaseType),
    connectionString: 'string > 1',
    isPasswordExists: 'boolean',
  }))
  .mutation(async ({ input, ctx }) => {
    const [connection] = await db.insert(databases).values({
      name: input.name,
      type: input.type,
      connectionString: encrypt({ text: input.connectionString, secret: ctx.user.secret }),
      isPasswordExists: input.isPasswordExists,
      userId: ctx.user.id,
    }).returning({ id: databases.id })

    return connection
  })
