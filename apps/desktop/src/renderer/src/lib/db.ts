import type { CollectionConfig, DeleteMutationFnParams, InsertMutationFnParams, PendingMutation, SyncConfig, UpdateMutationFnParams } from '@tanstack/react-db'
import type { IndexColumn, PgTable } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-arktype'
import { eq, inArray } from 'drizzle-orm'
import { db, waitForMigrations } from '~/drizzle'

// eslint-disable-next-line ts/no-explicit-any
export function pgLiteCollectionOptions<Table extends PgTable<any>>({
  startSync = true,
  ...config
}: {
  table: Table
  getPrimaryColumn: (row: Table) => IndexColumn
  startSync?: boolean
  onInsert?: (params: InsertMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onUpdate?: (params: UpdateMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onDelete?: (params: DeleteMutationFnParams<Table['$inferSelect'], string>) => Promise<void>
  onSync?: (params: Pick<Parameters<SyncConfig<Table['$inferSelect'], string>['sync']>[0], 'write' | 'collection' | 'truncate'>) => Promise<void>
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

  async function onPgLiteInsert(data: typeof config.table.$inferInsert[]) {
    // @ts-expect-error drizzle types
    await db.insert(config.table).values(data).catch((error) => {
      if (import.meta.env.DEV) {
        console.error('error on insert db', error)
      }
      throw error
    })
  }

  async function onPgLiteUpdate(id: string, changes: Partial<typeof config.table.$inferSelect>) {
    await db.update(config.table).set(changes).where(eq(primaryColumn, id)).catch((error) => {
      if (import.meta.env.DEV) {
        console.error('error on update db', error)
      }
      throw error
    })
  }

  async function onPgLiteDelete(ids: string[]) {
    await db.delete(config.table).where(inArray(primaryColumn, ids)).catch((error) => {
      if (import.meta.env.DEV) {
        console.error('error on delete db', error)
      }
      throw error
    })
  }

  const getSyncParams = async (): Promise<Pick<SyncParams, 'write' | 'collection' | 'truncate'>> => {
    const params = await syncParams

    return {
      write: async (p) => {
        params.begin()
        if (p.type === 'insert') {
          await onPgLiteInsert([p.value])
        }
        else if (p.type === 'update') {
          await onPgLiteUpdate(params.collection.getKeyFromItem(p.value), p.value)
        }
        else if (p.type === 'delete') {
          await onPgLiteDelete([params.collection.getKeyFromItem(p.value)])
        }
        params.write(p)
        params.commit()
      },
      collection: params.collection,
      truncate: params.truncate,
    }
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
        if (config.onSync && startSync) {
          await config.onSync(await getSyncParams())
        }
        params.markReady()
      },
    },
    gcTime: 0,
    schema: createSelectSchema(config.table),
    getKey: t => t[primaryColumn.name],
    onDelete: async (params) => {
      await onPgLiteDelete(params.transaction.mutations.map(m => m.key))
      const result = await config.onDelete?.(params)
      await runMutations(params.transaction.mutations)
      return result
    },
    onInsert: async (params) => {
      await onPgLiteInsert(params.transaction.mutations.map(m => m.modified))
      const result = await config.onInsert?.(params)
      await runMutations(params.transaction.mutations)
      return result
    },
    onUpdate: async (params) => {
      await Promise.all(params.transaction.mutations.map(m => onPgLiteUpdate(m.key, m.changes)))
      const result = await config.onUpdate?.(params)
      await runMutations(params.transaction.mutations)
      return result
    },
    utils: {
      runSync: async () => {
        const params = await getSyncParams()

        // To wait the first sync
        await params.collection.stateWhenReady()

        await config.onSync?.(params)
      },
    },
  } satisfies CollectionConfig<Table['$inferSelect'], string> & { utils: { runSync: () => Promise<void> } }
}
