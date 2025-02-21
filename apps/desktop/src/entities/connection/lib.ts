import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import { indexedDb } from '~/lib/indexeddb'
import { trpc } from '~/lib/trpc'

export async function fetchConnections() {
  const fetchedConnections = await trpc.connections.list.query()
  const existingConnections = await indexedDb.connections.toArray()
  const existingIds = new Set(existingConnections.map(c => c.id))

  await Promise.all([
    Promise.all(
      existingConnections
        .filter(c => !fetchedConnections.find(tc => tc.id === c.id))
        .map(c => indexedDb.connections.delete(c.id)),
    ),
    Promise.all(
      fetchedConnections
        .filter(c => !existingIds.has(c.id))
        .map(c => indexedDb.connections.add({
          ...c,
          isPasswordPopulated: !!new URL(c.connectionString).password,
        })),
    ),
  ])
}

export async function createConnection(connection: {
  name: string
  type: ConnectionType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new URL(connection.connectionString)

  const isPasswordHidden = !!url.password && !connection.saveInCloud

  if (isPasswordHidden) {
    url.password = ''
  }

  const { id } = await trpc.connections.create.mutate({
    ...connection,
    connectionString: url.toString(),
    isPasswordHidden,
  })

  await indexedDb.connections.add({ id, ...connection, isPasswordHidden, isPasswordPopulated: !isPasswordHidden })

  return { id }
}
