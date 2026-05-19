import { createCollection } from '@tanstack/react-db'
import { drizzleCollectionOptions } from 'tanstack-db-pglite'
import { db, waitForMigrations } from '~/drizzle'
import { queries } from '~/drizzle/schema'
import { connectionsCollection } from '~/entities/connection/sync'
import { isSignedIn } from '~/lib/auth'
import { orpc } from '~/lib/orpc'

export const queriesCollection = createCollection(drizzleCollectionOptions({
  db,
  table: queries,
  primaryColumn: queries.id,
  startSync: false,
  prepare: waitForMigrations,
  sync: async ({ write, markReady }) => {
    if (!navigator.onLine || !await isSignedIn()) {
      markReady()
      return
    }

    await connectionsCollection.stateWhenReady()

    const abortController = new AbortController()

    const sync = await orpc.sync.queries.call(
      await db.select({ id: queries.id, updatedAt: queries.updatedAt }).from(queries),
      { signal: abortController.signal },
    )

    ;(async () => {
      for await (const item of sync) {
        if (item.type === 'synced') {
          markReady()
        }
        else if (item.type === 'delete') {
          write({ type: 'delete', key: item.value })
        }
      }
    })()

    return () => {
      abortController.abort()
    }
  },
  onInsert: async ({ transaction }) => {
    await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
  },
  onDelete: async ({ transaction }) => {
    await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
  },
}))
