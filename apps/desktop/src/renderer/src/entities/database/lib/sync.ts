import { SafeURL } from '@conar/shared/utils/url'
import { eq } from 'drizzle-orm'
import { toast } from 'sonner'
import { databases, db } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export async function syncDatabases() {
  if (!navigator.onLine) {
    return
  }

  try {
    const [fetchedDatabases, existingDatabases] = await Promise.all([
      orpc.databases.list(),
      db.select().from(databases),
    ])
    const fetchedMap = new Map(fetchedDatabases.map(d => [d.id, d]))
    const existingMap = new Map(existingDatabases.map(d => [d.id, d]))

    const toDelete = existingDatabases.filter(d => !fetchedMap.has(d.id)).map(d => d.id)
    const toAdd = fetchedDatabases.filter(d => !existingMap.has(d.id))
      .map(d => ({
        ...d,
        isPasswordPopulated: !!new SafeURL(d.connectionString).password,
      }))
    const toUpdate = fetchedDatabases
      .filter(d => existingMap.has(d.id))
      .map((d) => {
        const existing = existingMap.get(d.id)!
        const changes: Partial<typeof databases.$inferSelect> = {}

        if (existing.name !== d.name) {
          changes.name = d.name
        }

        const existingUrl = new SafeURL(existing.connectionString)
        existingUrl.password = ''
        const fetchedUrl = new SafeURL(d.connectionString)
        fetchedUrl.password = ''

        if (existingUrl.toString() !== fetchedUrl.toString()) {
          changes.connectionString = d.connectionString
          changes.isPasswordExists = !!d.isPasswordExists
          changes.isPasswordPopulated = !!new SafeURL(d.connectionString).password
        }

        return {
          id: d.id,
          changes,
        }
      })
      .filter(d => Object.keys(d.changes).length > 0)

    await db.transaction(async (tx) => {
      await Promise.all([
        ...toDelete.map(id => tx.delete(databases).where(eq(databases.id, id))),
        ...toAdd.map(d => tx.insert(databases).values(d)),
        ...toUpdate.map(d => tx.update(databases).set(d.changes).where(eq(databases.id, d.id))),
      ])
    })
  }
  catch (e) {
    console.error(e)
    toast.error('Failed to fetch databases. Please try again later.')
  }
}
