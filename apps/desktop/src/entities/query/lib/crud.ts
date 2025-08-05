import type { databases } from '~/drizzle'
import { eq } from 'drizzle-orm'
import { db, queries } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export async function createQuery({ database, name, query }: { database: typeof databases.$inferSelect, name: string, query: string }) {
  const { id } = await orpc.queries.create({
    databaseId: database.id,
    name,
    query,
  })

  await db.insert(queries).values({
    id,
    databaseId: database.id,
    name,
    query,
  })

  return { id }
}

export async function removeQuery(id: string) {
  await Promise.all([
    orpc.queries.remove({ id }),
    db.delete(queries).where(eq(queries.id, id)),
  ])
}
