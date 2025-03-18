import { encrypt } from '@connnect/shared/encryption'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { z } from 'zod'
import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const create = protectedProcedure
  .input(z.object({
    name: z.string().min(1),
    type: z.nativeEnum(DatabaseType),
    connectionString: z.string().min(1),
    isPasswordExists: z.boolean(),
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
