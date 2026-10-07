import type { McpSource } from '@tamery/shared/mcp'
import { SafeURL } from '@tamery/shared/safe-url'

import { getCollections } from '~/core/collections'
import { posthog } from '~/lib/posthog'

export const mcpSource: McpSource = {
  connections: () => {
    const { connectionsCollection, connectionsResourcesCollection } =
      getCollections()
    const resources = connectionsResourcesCollection.toArray

    return connectionsCollection.toArray.map((connection) => ({
      databases: resources.flatMap((resource) =>
        resource.connectionId === connection.id && resource.name
          ? [resource.name]
          : []
      ),
      id: connection.id,
      name: connection.name,
      type: connection.type,
    }))
  },
  target: async ({ connectionId, database }) => {
    const { connectionsCollection, connectionStringsCollection } =
      getCollections()
    const connection = connectionsCollection.get(connectionId)

    if (!connection) {
      throw new Error(
        `Connection "${connectionId}" not found. Call list_connections for valid ids.`
      )
    }

    if (
      connection.isPasswordExists &&
      !connectionStringsCollection.get(connectionId)?.isPasswordPopulated
    ) {
      throw new Error(
        `"${connection.name}" needs its password. Open it in Tamery and enter the password first.`
      )
    }

    const url = new SafeURL(
      await connectionStringsCollection.utils.decrypt(connectionId)
    )
    if (database) {
      url.pathname = database
    }

    posthog.capture('mcp_query_run', { connection_type: connection.type })

    return { connectionString: url.toString(), type: connection.type }
  },
}
