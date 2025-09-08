import type { CollectionConfig, DeleteMutationFnParams, InsertMutationFnParams, SyncConfig, UpdateMutationFnParams } from '@tanstack/react-db'
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
      const keys = params.transaction.mutations.map(mutation => mutation.key)
      await db.delete(config.table).where(inArray(primaryColumn, keys))
      syncParams.begin()
      params.transaction.mutations.forEach(m => syncParams.write({ type: 'delete', value: m.key }))
      syncParams.commit()
    },
    onInsert: async (params) => {
      await db.insert(config.table).values(params.transaction.mutations.map(m => m.modified))
      await config.onInsert?.(params)
      syncParams.begin()
      params.transaction.mutations.forEach(m => syncParams.write({ type: 'insert', value: m.modified }))
      syncParams.commit()
    },
    onUpdate: async (params) => {
      await db.transaction(async (tx) => {
        await Promise.all(params.transaction.mutations.map(mutation =>
          tx.update(config.table).set(mutation.changes).where(eq(primaryColumn, mutation.key)),
        ))
      })
      await config.onUpdate?.(params)
      syncParams.begin()
      params.transaction.mutations.forEach(m => syncParams.write({ type: 'update', value: m.modified }))
      syncParams.commit()
    },
  } satisfies CollectionConfig<Table['$inferSelect'], string>
}
