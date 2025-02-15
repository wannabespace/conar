import { decrypt } from '@connnect/shared/encryption'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const get = protectedProcedure
  .input(z.object({
    id: z.string().uuid(),
  }))
  .query(async ({ ctx, input }) => {
    const [database] = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.userId, ctx.user.id),
          eq(connections.id, input.id),
        ),
      )

    if (!database) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
    }

    const connectionString = decrypt({ encryptedText: database.connectionString, secret: ctx.user.secret })

    return {
      ...database,
      connectionString,
    }
  })
