import { connections } from '@conar/db/schema'
import { eq } from 'drizzle-orm'
import { createShape } from '~/lib/electric'

export const connectionsShape = createShape(async (c) => {
  return {
    where: eq(connections.userId, c.get('userId')),
    table: 'connections' satisfies typeof connections._.name,
    columns: [
      connections.id,
      connections.createdAt,
      connections.updatedAt,
      connections.type,
      connections.name,
      connections.label,
      connections.color,
      connections.isPasswordExists,
      connections.syncType,
    ],
  }
})
