import { decrypt } from '@conar/shared/encryption'
import { desc, eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
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
        connectionString: decrypt({ encryptedText: database.connectionString, secret: ctx.user.secret }),
      }
    })
  })
