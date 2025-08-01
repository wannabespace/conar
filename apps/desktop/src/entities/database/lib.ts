import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { WhereFilter } from '@conar/shared/sql/where'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
import { databases, db } from '~/drizzle'
import { trpc } from '~/lib/trpc'
import { queryClient } from '~/main'
import { databaseTableColumnsQuery } from './queries/columns'
import { tablesAndSchemasQuery } from './queries/context'
import { databaseQuery, databasesQuery } from './queries/database'
import { databaseEnumsQuery } from './queries/enums'
import { databasePrimaryKeysQuery } from './queries/primary-keys'
import { databaseRowsQuery } from './queries/rows'
import { databaseTableTotalQuery } from './queries/total'

export async function fetchDatabases() {
  if (!navigator.onLine) {
    return
  }

  try {
    const [fetchedDatabases, existingDatabases] = await Promise.all([
      trpc.databases.list.query(),
      db.select().from(databases),
    ])
    const existingMap = new Map(existingDatabases.map(d => [d.id, d]))
    const fetchedMap = new Map(fetchedDatabases.map(d => [d.id, d]))

    const toDelete = existingDatabases
      .filter(d => !fetchedMap.has(d.id))
      .map(d => d.id)
    const toAdd = fetchedDatabases
      .filter(d => !existingMap.has(d.id))
      .map(d => ({
        ...d,
        isPasswordPopulated: !!new URL(d.connectionString).password,
      }))
    const toUpdate = fetchedDatabases
      .filter(d => !!existingMap.get(d.id))
      .map((d) => {
        const existing = existingMap.get(d.id)!
        const changes: Partial<typeof databases.$inferSelect> = {}

        if (existing.name !== d.name) {
          changes.name = d.name
        }

        const existingUrl = new URL(existing.connectionString)
        existingUrl.password = ''
        const fetchedUrl = new URL(d.connectionString)
        fetchedUrl.password = ''

        if (existingUrl.toString() !== fetchedUrl.toString()) {
          changes.connectionString = d.connectionString
          changes.isPasswordExists = !!d.isPasswordExists
          changes.isPasswordPopulated = !!new URL(d.connectionString).password
        }

        return {
          id: d.id,
          changes,
        }
      })
      .filter(d => Object.keys(d.changes).length > 0)

    await Promise.all([
      ...toDelete.map(id => db.delete(databases).where(eq(databases.id, id))),
      ...toAdd.map(d => db.insert(databases).values(d)),
      ...toUpdate.map(d => db.update(databases).set(d.changes).where(eq(databases.id, d.id))),
    ]);

    [
      ...toDelete,
      ...toAdd.map(d => d.id),
      ...toUpdate.filter(d => Object.keys(d.changes).length > 0).map(d => d.id),
    ].forEach((id) => {
      queryClient.invalidateQueries(databaseQuery(id))
    })
    queryClient.invalidateQueries(databasesQuery())
  }
  catch (e) {
    console.error(e)
    toast.error('Failed to fetch databases. Please try again later.')
  }
}

export async function createDatabase({ saveInCloud, ...database }: {
  name: string
  type: DatabaseType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = new URL(database.connectionString.trim())

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const { id } = await trpc.databases.create.mutate({
    ...database,
    connectionString: url.toString(),
    isPasswordExists,
  })

  await db.insert(databases).values({
    ...database,
    id,
    isPasswordExists,
    isPasswordPopulated: isPasswordExists,
    createdAt: new Date(),
  })

  return { id }
}

export async function removeDatabase(id: string) {
  await Promise.all([
    trpc.databases.remove.mutate({ id }),
    db.delete(databases).where(eq(databases.id, id)),
  ])
}

export async function renameDatabase(id: string, name: string) {
  const [existing] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

  if (!existing) {
    throw new Error('Database not found')
  }

  await Promise.all([
    trpc.databases.update.mutate({ id, name }),
    db.update(databases).set({ name }).where(eq(databases.id, id)),
  ])
}

export async function updateDatabasePassword(id: string, password: string) {
  const [database] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

  if (!database) {
    throw new Error('Database not found')
  }

  const url = new URL(database.connectionString)

  url.password = password

  await db.update(databases).set({
    connectionString: url.toString(),
    isPasswordPopulated: true,
  }).where(eq(databases.id, id))
}

export async function prefetchDatabaseCore(database: typeof databases.$inferSelect) {
  if (database.isPasswordExists && !database.isPasswordPopulated) {
    await queryClient.prefetchQuery(databaseQuery(database.id))
    return
  }

  await Promise.all([
    queryClient.prefetchQuery(databaseQuery(database.id)),
    queryClient.prefetchQuery(tablesAndSchemasQuery(database)),
  ])

  await Promise.all([
    queryClient.prefetchQuery(databasePrimaryKeysQuery(database)),
    queryClient.prefetchQuery(databaseEnumsQuery(database)),
  ])
}

export async function prefetchDatabaseTableCore(database: typeof databases.$inferSelect, schema: string, table: string, query: {
  filters: WhereFilter[]
  orderBy: Record<string, 'ASC' | 'DESC'>
}) {
  await Promise.all([
    queryClient.prefetchInfiniteQuery(databaseRowsQuery(database, table, schema, query)),
    queryClient.prefetchQuery(databaseTableTotalQuery(database, table, schema, query)),
    queryClient.prefetchQuery(databaseTableColumnsQuery(database, table, schema)),
  ])
}
