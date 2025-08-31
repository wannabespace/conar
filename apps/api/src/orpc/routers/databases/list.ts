import { decrypt } from '@conar/shared/encryption'
import { ORPCError } from '@orpc/server'
import { desc, eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const list = orpc
  .use(authMiddleware)
  .handler(async ({ context }) => {
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
      .where(eq(databases.userId, context.user.id))
      .orderBy(desc(databases.createdAt))

    try {
      return list.map(database => ({
        ...database,
        connectionString: decrypt({ encryptedText: database.connectionString, secret: context.user.secret }),
      }))
    }
    catch {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Failed to decrypt database connection string',
      })
    }
  })
