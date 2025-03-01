import type { ConnectionType } from '@connnect/shared/enums/connection-type'
import { indexedDb } from '~/lib/indexeddb'
import { trpc } from '~/trpc'

export async function fetchConnections() {
  const [fetchedConnections, existingConnections] = await Promise.all([
    trpc.connections.list.query(),
    indexedDb.connections.toArray(),
  ])
  const existingIds = new Set(existingConnections.map(c => c.id))
  const fetchedIds = new Set(fetchedConnections.map(c => c.id))

  await Promise.all([
    indexedDb.connections.bulkDelete(
      existingConnections
        .filter(c => !fetchedIds.has(c.id))
        .map(c => c.id),
    ),
    indexedDb.connections.bulkAdd(
      fetchedConnections
        .filter(c => !existingIds.has(c.id))
        .map(c => ({
          ...c,
          isPasswordPopulated: !!new URL(c.connectionString).password,
        })),
    ),
  ])
}

export async function createConnection({ saveInCloud, ...connection }: {
  name: string
  type: ConnectionType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new URL(connection.connectionString)

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const { id } = await trpc.connections.create.mutate({
    ...connection,
    connectionString: url.toString(),
    isPasswordExists,
  })

  await indexedDb.connections.add({ id, ...connection, isPasswordExists, isPasswordPopulated: isPasswordExists })

  return { id }
}

export async function removeConnection(id: string) {
  await Promise.all([
    trpc.connections.remove.mutate({ id }),
    indexedDb.connections.delete(id),
  ])
}

export async function updatePassword(id: string, password: string) {
  const connection = await indexedDb.connections.get(id)

  if (!connection) {
    throw new Error('Connection not found')
  }

  const url = new URL(connection.connectionString)
  url.password = password
  connection.connectionString = url.toString()
  connection.isPasswordPopulated = true

  await indexedDb.connections.put(connection)
}
