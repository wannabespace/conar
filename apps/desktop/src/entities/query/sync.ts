import { createCollection } from '@tanstack/react-db'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { db, waitForMigrations } from '~/drizzle'
import { queries } from '~/drizzle/schema'
import { connectionsCollection } from '~/entities/connection/sync'
import { bearerToken } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: queries,
  primaryColumn: queries.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: async ({ collection, write }) => {
    if (!bearerToken.get() || !navigator.onLine) {
      return
    }

    await connectionsCollection.utils.waitForSync()
    const sync = await orpc.queries.sync.call(collection.toArray.map(c => ({ id: c.id, updatedAt: c.updatedAt })))

    sync.forEach((item) => {
      if (item.type === 'delete') {
        write({ type: 'delete', value: collection.get(item.value)! })
      }
      else {
        write(item)
      }
    })
  },
  onInsert: async ({ transaction }) => {
    await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
  },
  onDelete: async ({ transaction }) => {
    await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
  },
}))
