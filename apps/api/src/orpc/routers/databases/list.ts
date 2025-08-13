import { decrypt } from '@conar/shared/encryption'
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

    return list.map((database) => {
      return {
        ...database,
        connectionString: decrypt({ encryptedText: database.connectionString, secret: context.user.secret }),
      }
    })
  })
