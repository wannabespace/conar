import { encrypt } from '@conar/shared/encryption'
import { DatabaseType } from '@conar/shared/enums/database-type'
import { type } from 'arktype'
import { databases, db } from '~/drizzle'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(type({
    name: 'string > 0',
    type: type.valueOf(DatabaseType),
    connectionString: 'string > 0',
    isPasswordExists: 'boolean',
  }))
  .handler(async ({ context, input }) => {
    const [connection] = await db.insert(databases).values({
      name: input.name,
      type: input.type,
      connectionString: encrypt({ text: input.connectionString, secret: context.user.secret }),
      isPasswordExists: input.isPasswordExists,
      userId: context.user.id,
    }).returning({ id: databases.id })

    return connection
  })
