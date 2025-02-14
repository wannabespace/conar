import { encrypt } from '@connnect/shared/encryption'
import { DatabaseType } from '@connnect/shared/enums/database-type'
import { z } from 'zod'
import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const create = protectedProcedure
  .input(z.object({
    name: z.string().optional(),
    type: z.nativeEnum(DatabaseType),
    host: z.string().min(1),
    port: z.number().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    database: z.string().min(1),
    srv: z.boolean().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const encryptedPassword = encrypt({ text: input.password, secret: ctx.user.secret })

    const [database] = await db.insert(databases).values({
      name: input.name,
      type: input.type,
      credentials: {
        host: input.host,
        port: input.port,
        username: input.username,
        password: encryptedPassword,
        database: input.database,
        srv: input.srv,
      },
      userId: ctx.user.id,
    }).returning({ id: databases.id })

    return database
  })
