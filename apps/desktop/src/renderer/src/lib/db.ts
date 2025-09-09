import type { CollectionConfig, DeleteMutationFnParams, InsertMutationFnParams, PendingMutation, SyncConfig, UpdateMutationFnParams } from '@tanstack/react-db'
import type { IndexColumn, PgTable } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-arktype'
import { eq, inArray } from 'drizzle-orm'
import { db, waitForMigrations } from '~/drizzle'

// eslint-disable-next-line ts/no-explicit-any
export function pgLiteCollectionOptions<Table extends PgTable<any>>(config: {
  table: Table
  getPrimaryColumn: (row: Table) => IndexColumn
  onInsert?: (params: InsertMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onUpdate?: (params: UpdateMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onDelete?: (params: DeleteMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
}) {
  type SyncParams = Parameters<SyncConfig<Table['$inferSelect'], string>['sync']>[0]

  // Sync params can be null while running PGLite migrations
  const { promise: syncParams, resolve: resolveSyncParams } = Promise.withResolvers<SyncParams>()
  const primaryColumn = config.getPrimaryColumn(config.table)

  async function runMutations(mutations: PendingMutation[]) {
    const { begin, write, commit } = await syncParams
    begin()
    mutations.forEach((m) => {
      write({ type: m.type, value: m.modified })
    })
    commit()
  }

  return {
    startSync: true,
    sync: {
      sync: async (params) => {
        resolveSyncParams(params)
        await waitForMigrations()
        params.begin()
        // @ts-expect-error drizzle types
        const dbs = await db.select().from(config.table)
        dbs.forEach((db) => {
          params.write({ type: 'insert', value: db })
        })
        params.commit()
        params.markReady()
      },
    },
    gcTime: 0,
    schema: createSelectSchema(config.table),
    getKey: t => t[primaryColumn.name],
    onDelete: async (params) => {
      if (import.meta.env.DEV) {
        console.log('onDelete db', params)
      }
      await params.collection.stateWhenReady()
      const result = await db.transaction(async (tx) => {
        await tx.delete(config.table).where(inArray(primaryColumn, params.transaction.mutations.map(m => m.key))).catch((error) => {
          if (import.meta.env.DEV) {
            console.error('error on delete db', error)
          }
          throw error
        })
        return await config.onDelete?.(params)
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('error on delete db tx', error)
        }
        throw error
      })
      await runMutations(params.transaction.mutations)
      return result
    },
    onInsert: async (params) => {
      await params.collection.stateWhenReady()
      const result = await db.transaction(async (tx) => {
        await tx.insert(config.table).values(params.transaction.mutations.map(m => m.modified)).catch((error) => {
          if (import.meta.env.DEV) {
            console.error('error on insert db', error)
          }
          throw error
        })
        return await config.onInsert?.(params)
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('error on insert db tx', error)
        }
        throw error
      })
      await runMutations(params.transaction.mutations)
      return result
    },
    onUpdate: async (params) => {
      await params.collection.stateWhenReady()
      const result = await db.transaction(async (tx) => {
        await Promise.all(params.transaction.mutations.map(mutation =>
          tx.update(config.table).set(mutation.changes).where(eq(primaryColumn, mutation.key)).catch((error) => {
            if (import.meta.env.DEV) {
              console.error('error on update db', error)
            }
            throw error
          }),
        ))
        return await config.onUpdate?.(params)
      }).catch((error) => {
        if (import.meta.env.DEV) {
          console.error('error on update db tx', error)
        }
        throw error
      })
      await runMutations(params.transaction.mutations)
      return result
    },
  } satisfies CollectionConfig<Table['$inferSelect'], string>
}
