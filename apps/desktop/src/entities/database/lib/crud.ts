import type { DatabaseType } from '@conar/shared/enums/database-type'
import { parseUrl } from '@conar/shared/utils/url'
import { eq } from 'drizzle-orm'
import { databases, db } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export async function createDatabase({ saveInCloud, ...database }: {
  name: string
  type: DatabaseType
  connectionString: string
  saveInCloud: boolean
}) {
  const url = parseUrl(database.connectionString.trim())

  const isPasswordExists = !!url.password

  if (isPasswordExists && !saveInCloud) {
    url.password = ''
  }

  const { id } = await orpc.databases.create({
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
    orpc.databases.remove({ id }),
    db.delete(databases).where(eq(databases.id, id)),
  ])
}

export async function renameDatabase(id: string, name: string) {
  const [existing] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

  if (!existing) {
    throw new Error('Database not found')
  }

  await Promise.all([
    orpc.databases.update({ id, name }),
    db.update(databases).set({ name }).where(eq(databases.id, id)),
  ])
}

export async function updateDatabasePassword(id: string, password: string) {
  const [database] = await db.select().from(databases).where(eq(databases.id, id)).limit(1)

  if (!database) {
    throw new Error('Database not found')
  }

  const url = parseUrl(database.connectionString)

  url.password = password

  await db.update(databases).set({
    connectionString: url.toString(),
    isPasswordPopulated: true,
  }).where(eq(databases.id, id))
}
