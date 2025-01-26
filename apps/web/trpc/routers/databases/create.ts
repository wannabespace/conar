import { encrypt } from '@connnect/shared/encryption'
import { z } from 'zod'
import { databases, databaseType, db } from '~/drizzle'
import { env } from '~/env'
import { protectedProcedure } from '~/trpc'

export const create = protectedProcedure
  .input(z.object({
    name: z.string().optional(),
    type: z.enum(databaseType.enumValues),
    host: z.string().min(1),
    port: z.number().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    database: z.string().min(1),
  }))
  .mutation(async ({ input, ctx }) => {
    const encryptedPassword = await encrypt({ text: input.password, secret: env.ENCRYPTION_SECRET })

    await db.insert(databases).values({
      name: input.name,
      type: input.type,
      host: input.host,
      port: input.port,
      username: input.username,
      encryptedPassword,
      database: input.database,
      userId: ctx.user.id,
    })
  })
