import { queryOptions } from '@tanstack/react-query'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
import { db, queries } from '~/drizzle'
import { orpc } from '~/lib/orpc'

async function syncQueries() {
  try {
    const [fetchedQueries, existingQueries] = await Promise.all([
      orpc.queries.list(),
      db.query.queries.findMany(),
    ])
    const fetchedMap = new Map(fetchedQueries.map(q => [q.id, q]))
    const existingMap = new Map(existingQueries.map(q => [q.id, q]))

    const toDelete = existingQueries
      .filter(q => !fetchedMap.has(q.id))
      .map(q => q.id)
    const toAdd = fetchedQueries
      .filter(q => !existingMap.has(q.id))
    const toUpdate = fetchedQueries
      .filter(q => existingMap.has(q.id))
      .map((q) => {
        const existing = existingMap.get(q.id)!
        const changes: Partial<typeof queries.$inferSelect> = {}

        if (q.name !== existing.name) {
          changes.name = q.name
        }
        if (q.query !== existing.query) {
          changes.query = q.query
        }
        if (q.updatedAt.getTime() !== existing.updatedAt.getTime()) {
          changes.updatedAt = q.updatedAt
        }

        return {
          id: q.id,
          changes,
        }
      })
      .filter(q => Object.keys(q.changes).length > 0)

    await db.transaction(async (tx) => {
      await Promise.all([
        ...toDelete.map(id => tx.delete(queries).where(eq(queries.id, id))),
        ...toAdd.map(q => tx.insert(queries).values(q)),
        ...toUpdate.map(q => tx.update(queries).set(q.changes).where(eq(queries.id, q.id))),
      ])
    })
  }
  catch (e) {
    console.error(e)
    toast.error('Failed to fetch queries. Please try again later.')
  }
}

export const syncQueriesQueryOptions = queryOptions({
  queryKey: ['sync-queries'],
  queryFn: async () => {
    await syncQueries()
    return true
  },
  enabled: false,
})
