import { decrypt } from '@conar/shared/encryption'
import { TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import { protectedProcedure } from '~/__trpc__deprecated'
import { databases, db } from '~/drizzle'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      columns: {
        secret: true,
      },
      where: (table, { eq }) => eq(table.id, ctx.user.id),
    })

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'We could not find your user. Please sign in again.' })
    }

    const list = await db
      .select({
        id: databases.id,
        name: databases.name,
        type: databases.type,
        isPasswordExists: databases.isPasswordExists,
        createdAt: databases.createdAt,
        updatedAt: databases.updatedAt,
        connectionString: databases.connectionString,
      })
      .from(databases)
      .where(eq(databases.userId, ctx.user.id))
      .orderBy(desc(databases.createdAt))

    return list.map((database) => {
      return {
        ...database,
        connectionString: decrypt({ encryptedText: database.connectionString, secret: user.secret }),
      }
    })
  })
