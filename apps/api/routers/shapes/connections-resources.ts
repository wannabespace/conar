import { connections, connectionsResources } from '@conar/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { createShape, qb } from '~/lib/electric'

export const connectionsResourcesShape = createShape(async (c) => {
  const userConnections = qb
    .select({ id: connections.id })
    .from(connections)
    .where(eq(connections.userId, c.get('userId')))

  return {
    where: inArray(connectionsResources.connectionId, userConnections),
    table: 'connections_resources' satisfies typeof connectionsResources._.name,
  }
})
