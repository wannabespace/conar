import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { indexedDb } from '~/lib/indexeddb'
import { trpc } from '~/lib/trpc'

export async function fetchDatabases() {
  const [fetchedDatabases, existingDatabases] = await Promise.all([
    trpc.databases.list.query(),
    indexedDb.databases.toArray(),
  ])
  const existingIds = new Set(existingDatabases.map(d => d.id))
  const fetchedIds = new Set(fetchedDatabases.map(d => d.id))

  await Promise.all([
    indexedDb.databases.bulkDelete(
      existingDatabases
        .filter(d => !fetchedIds.has(d.id))
        .map(d => d.id),
    ),
    indexedDb.databases.bulkAdd(
      fetchedDatabases
        .filter(d => !existingIds.has(d.id))
        .map(d => ({
          ...d,
          isPasswordPopulated: !!new URL(d.connectionString).password,
        })),
    ),
  ])
}

export async function createDatabase({ saveInCloud, ...database }: {
  name: string
  type: DatabaseType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new URL(database.connectionString)

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const { id } = await trpc.databases.create.mutate({
    ...database,
    connectionString: url.toString(),
    isPasswordExists,
  })

  await indexedDb.databases.add({
    ...database,
    id,
    isPasswordExists,
    isPasswordPopulated: isPasswordExists,
    createdAt: new Date(),
  })

  return { id }
}

export async function removeConnection(id: string) {
  await Promise.all([
    trpc.databases.remove.mutate({ id }),
    indexedDb.databases.delete(id),
  ])
}

export async function updateDatabasePassword(id: string, password: string) {
  const database = await indexedDb.databases.get(id)

  if (!database) {
    throw new Error('Database not found')
  }

  const url = new URL(database.connectionString)
  url.password = password
  database.connectionString = url.toString()
  database.isPasswordPopulated = true

  await indexedDb.databases.put(database)
}
