import type { ORPCOutputs } from '~/lib/orpc'
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
  sync: {
    sync: async ({ writeAsync, markReady }) => {
      if (!navigator.onLine || !await isSignedIn()) {
        return
      }

      await connectionsCollection.stateWhenReady()

      const abortController = new AbortController()

      const events = await orpc.queries.events.call({}, {
        signal: abortController.signal,
      })

      const writeItem = async (item: ORPCOutputs['queries']['sync'][number]) => {
        if (item.type === 'delete') {
          await writeAsync(item)
        }
        else if (item.value?.connectionResourceId) {
          await writeAsync({
            type: item.type,
            value: {
              ...item.value,
              connectionResourceId: item.value.connectionResourceId!,
            },
          })
        }
      }

      ;(async () => {
        for await (const item of events) {
          await writeItem(item)
        }
      })()

      const sync = await orpc.queries.sync.call(
        await db.select({ id: queries.id, updatedAt: queries.updatedAt }).from(queries),
        { signal: abortController.signal },
      )

      for (const item of sync) {
        await writeItem(item)
      }

      markReady()

      return () => {
        console.log('aborting queries sync')
        abortController.abort()
      }
    },
  },
  onInsert: async ({ transaction }) => {
    await orpc.queries.create.call(transaction.mutations.map(m => m.modified))
  },
  onDelete: async ({ transaction }) => {
    await orpc.queries.remove.call(transaction.mutations.map(m => ({ id: m.key })))
  },
}))
