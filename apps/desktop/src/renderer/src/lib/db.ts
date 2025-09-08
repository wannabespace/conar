import type { CollectionConfig, DeleteMutationFnParams, InsertMutationFnParams, PendingMutation, SyncConfig, UpdateMutationFnParams } from '@tanstack/react-db'
import type { Column } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-arktype'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/drizzle'

// eslint-disable-next-line ts/no-explicit-any
export function pgLiteCollectionOptions<Table extends PgTable<any>>(config: {
  table: Table
  getPrimaryColumn: (row: Table) => Column
  onInsert?: (params: InsertMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onUpdate?: (params: UpdateMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onDelete?: (params: DeleteMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
}) {
  let syncParams: Parameters<SyncConfig<Table['$inferSelect'], string>['sync']>[0]
  const primaryColumn = config.getPrimaryColumn(config.table)

  function runMutations(mutations: PendingMutation[]) {
    syncParams.begin()
    mutations.forEach((m) => {
      syncParams.write({ type: m.type, value: m.modified })
    })
    syncParams.commit()
  }

  return {
    startSync: true,
    sync: {
      sync: async (params: Parameters<SyncConfig<Table['$inferSelect'], string>['sync']>[0]) => {
        syncParams = params
        const { begin, write, commit, markReady } = params
        begin()
        // @ts-expect-error drizzle types
        const dbs = await db.select().from(config.table)
        dbs.forEach(db => write({ type: 'insert', value: db }))
        commit()
        markReady()
      },
    },
    gcTime: 0,
    schema: createSelectSchema(config.table),
    getKey: t => t[primaryColumn.name],
    onDelete: async (params) => {
      // eslint-disable-next-line ts/no-explicit-any
      let result: any
      await db.transaction(async (tx) => {
        await tx.delete(config.table).where(inArray(primaryColumn, params.transaction.mutations.map(m => m.key)))
        result = await config.onDelete?.(params)
      })
      runMutations(params.transaction.mutations)
      return result
    },
    onInsert: async (params) => {
      // eslint-disable-next-line ts/no-explicit-any
      let result: any
      await db.transaction(async (tx) => {
        await tx.insert(config.table).values(params.transaction.mutations.map(m => m.modified))
        result = await config.onInsert?.(params)
      })
      runMutations(params.transaction.mutations)
      return result
    },
    onUpdate: async (params) => {
      // eslint-disable-next-line ts/no-explicit-any
      let result: any
      await db.transaction(async (tx) => {
        await Promise.all(params.transaction.mutations.map(mutation =>
          tx.update(config.table).set(mutation.changes).where(eq(primaryColumn, mutation.key)),
        ))
        result = await config.onUpdate?.(params)
      })
      runMutations(params.transaction.mutations)
      return result
    },
  } satisfies CollectionConfig<Table['$inferSelect'], string>
}
