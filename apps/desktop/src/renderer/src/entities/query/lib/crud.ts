import type { databases } from '~/drizzle'
import { orpc } from '~/lib/orpc'
import { queriesCollection } from './sync'

export async function createQuery({ database, name, query }: { database: typeof databases.$inferSelect, name: string, query: string }) {
  const res = await orpc.queries.create({
    databaseId: database.id,
    name,
    query,
  })

  queriesCollection.insert(res)
}

export async function removeQuery(id: string) {
  await orpc.queries.remove({ id })
  queriesCollection.delete(id)
}
