import { decrypt } from '@connnect/shared/encryption'
import { desc, eq } from 'drizzle-orm'
import { connections, db } from '~/drizzle'
import { protectedProcedure } from '~/trpc'

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    const list = await db
      .select({
        id: connections.id,
        name: connections.name,
        type: connections.type,
        isPasswordExists: connections.isPasswordExists,
        connectionString: connections.connectionString,
      })
      .from(connections)
      .where(eq(connections.userId, ctx.user.id))
      .orderBy(desc(connections.createdAt))

    return list.map((connection) => {
      return {
        ...connection,
        connectionString: decrypt({ encryptedText: connection.connectionString, secret: ctx.user.secret }),
      }
    })
  })
