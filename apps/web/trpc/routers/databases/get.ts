import { decrypt } from '@connnect/shared/encryption'
import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { databases, db } from '~/drizzle'
import { env } from '~/env'
import { protectedProcedure } from '~/trpc'

export const get = protectedProcedure.input(z.object({
  id: z.string().uuid(),
})).query(async ({ ctx, input }) => {
  const [database] = await db
    .select()
    .from(databases)
    .where(
      and(
        eq(databases.userId, ctx.user.id),
        eq(databases.id, input.id),
      ),
    )

  if (!database) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
  }

  return {
    ...database,
    password: database.encryptedPassword
      ? decrypt({ encryptedText: database.encryptedPassword, secret: env.ENCRYPTION_SECRET })
      : null,
  }
})
