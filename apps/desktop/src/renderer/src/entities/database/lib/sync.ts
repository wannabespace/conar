import type { MutationOptions } from '@tanstack/react-query'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { createCollection } from '@tanstack/react-db'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { eq, inArray } from 'drizzle-orm'
import { databases, databasesSelectSchema, db } from '~/drizzle'
import { orpc } from '~/lib/orpc'

export const databasesCollection = createCollection({
  startSync: true,
  sync: {
    sync: async ({ begin, write, commit, markReady }) => {
      begin()
      const dbs = await db.select().from(databases)
      dbs.forEach(db => write({ type: 'insert', value: db }))
      commit()
      markReady()
    },
  },
  schema: databasesSelectSchema,
  getKey: database => database.id,
  onDelete: async ({ transaction }) => {
    const keys = transaction.mutations.map(mutation => mutation.key)
    if (keys.length > 0) {
      await db.delete(databases).where(inArray(databases.id, keys))
    }
  },
  onInsert: async ({ transaction }) => {
    await db.insert(databases).values(transaction.mutations.map(m => m.modified))
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(transaction.mutations.map(mutation =>
      db.update(databases).set(mutation.changes).where(eq(databases.id, mutation.key)),
    ))
  },
})

async function syncDatabases() {
  const existing = databasesCollection.toArray
  const iterator = await orpc.sync.databases(existing.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

  for await (const event of iterator) {
    // Temporary only one event
    if (event.type === 'sync') {
      event.data.forEach((item) => {
        if (item.type === 'insert') {
          databasesCollection.insert({
            ...item.value,
            isPasswordPopulated: !!new SafeURL(item.value.connectionString).password,
          })
        }
        else if (item.type === 'update') {
          databasesCollection.update(item.value.id, (draft) => {
            Object.assign(draft, item.value)

            if (item.value.connectionString) {
              draft.isPasswordPopulated = !!new SafeURL(item.value.connectionString).password
            }
          })
        }
        else if (item.type === 'delete') {
          databasesCollection.delete(item.value)
        }
      })
    }
  }
}

const syncDatabasesMutationOptions = {
  mutationKey: ['sync-databases'],
  mutationFn: syncDatabases,
} satisfies MutationOptions

export function useDatabasesSync() {
  const { mutate } = useMutation(syncDatabasesMutationOptions)

  return {
    sync: mutate,
    isSyncing: useIsMutating(syncDatabasesMutationOptions) > 0,
  }
}
