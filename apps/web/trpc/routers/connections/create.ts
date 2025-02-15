import { encrypt } from '@connnect/shared/encryption'
import { ConnectionType } from '@connnect/shared/enums/connection-type'
import { z } from 'zod'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const create = protectedProcedure
  .input(z.object({
    name: z.string().min(1),
    type: z.nativeEnum(ConnectionType),
    connectionString: z.string().min(1),
  }))
  .mutation(async ({ input, ctx }) => {
    const encryptedConnectionString = encrypt({ text: input.connectionString, secret: ctx.user.secret })

    const [connection] = await db.insert(connections).values({
      name: input.name,
      type: input.type,
      connectionString: encryptedConnectionString,
      userId: ctx.user.id,
    }).returning({ id: connections.id })

    return connection
  })
