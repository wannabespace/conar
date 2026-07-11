import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from '@tanstack/browser-db-sqlite-persistence'
import type { SyncConfig } from '@tanstack/react-db'
import { BasicIndex } from '@tanstack/react-db'

import { posthog } from './posthog'

export interface BaseTable {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface SyncTracker {
  markSynced: (key: string, updatedAt: Date) => void
  awaitChange: (key: string, updatedAt: Date, timeout?: number) => Promise<void>
}

export type SyncUtils = Pick<SyncTracker, 'awaitChange'>

function versionKey(key: string, updatedAt: Date) {
  return `${key}:${updatedAt.getTime()}`
}

export function createSyncTracker(): SyncTracker {
  const synced = new Set<string>()
  const listeners = new Set<() => void>()

  return {
    markSynced(key, updatedAt) {
      synced.add(versionKey(key, updatedAt))
      listeners.forEach(listener => listener())
    },
    awaitChange(key, updatedAt, timeout = 10_000) {
      const versioned = versionKey(key, updatedAt)

      if (synced.has(versioned)) return Promise.resolve()

      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          listeners.delete(listener)
          reject(new Error('awaitChange timed out'))
        }, timeout)

        function listener() {
          if (!synced.has(versioned)) return
          clearTimeout(timer)
          listeners.delete(listener)
          resolve()
        }

        listeners.add(listener)
      })
    },
  }
}

const DATABASE_NAME = `${GITHUB_REPO_NAME}.sqlite`

export const database = await openBrowserWASQLiteOPFSDatabase({
  databaseName: DATABASE_NAME,
})

if (import.meta.env.DEV) {
  // @ts-expect-error window is not typed
  window.database = database
}

const coordinator = new BrowserCollectionCoordinator({
  dbName: DATABASE_NAME,
})

export const persistence = createBrowserWASQLitePersistence({
  database,
  coordinator,
  schemaMismatchPolicy: 'reset',
})

export type SyncMessage<T> =
  | { type: 'insert'; value: T }
  | { type: 'update'; value: T }
  | { type: 'delete'; key: string }

type MutationFn<T> = (params: {
  transaction: { mutations: { key: string; modified: T; changes: Partial<T> }[] }
}) => Promise<void>

export interface SyncCollectionConfig<T extends { updatedAt: Date }> {
  id: string
  getKey: (item: T) => string
  events: (params: { signal: AbortSignal }) => Promise<AsyncIterable<SyncMessage<T>>>
  sync: (params: { rows: T[]; signal: AbortSignal }) => Promise<SyncMessage<T>[]>
  onInsert?: MutationFn<T>
  onUpdate?: MutationFn<T>
  onDelete?: MutationFn<T>
}

export function syncCollectionOptions<T extends { updatedAt: Date }>(
  config: SyncCollectionConfig<T>,
) {
  const tracker = createSyncTracker()

  const sync: SyncConfig<T, string> = {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()

      const writeItem = (item: SyncMessage<T>) => {
        if (item.type === 'delete') {
          write({ type: 'delete', key: item.key })
          return
        }
        write({ type: item.type, value: item.value })
        tracker.markSynced(config.getKey(item.value), item.value.updatedAt)
      }

      config
        .events({ signal: abortController.signal })
        .then(async events => {
          if (abortController.signal.aborted) return
          markReady()
          for await (const item of events) {
            if (abortController.signal.aborted) break
            begin()
            writeItem(item)
            commit()
          }

          return undefined
        })
        .catch(() => {
          if (!abortController.signal.aborted) markReady()
        })

      collection.toArrayWhenReady().then(async rows => {
        const items = await config.sync({ rows, signal: abortController.signal })
        if (abortController.signal.aborted) return
        begin()
        for (const item of items) {
          writeItem(item)
        }
        commit()

        return undefined
      })

      return () => {
        abortController.abort(`${config.id} sync aborted`)
      }
    },
  }

  return {
    id: config.id,
    getKey: config.getKey,
    autoIndex: 'eager' as const,
    defaultIndexType: BasicIndex,
    utils: { awaitChange: tracker.awaitChange },
    onInsert: config.onInsert,
    onUpdate: config.onUpdate,
    onDelete: config.onDelete,
    sync,
  }
}

export async function clearDb() {
  try {
    await database.execute('PRAGMA foreign_keys = OFF;')

    const tablesResult = await database.execute(`
      SELECT name
      FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `)

    const systemTables = new Set([
      'collection_registry',
      'persisted_index_registry',
      'applied_tx',
      'collection_version',
      'collection_metadata',
      'leader_term',
      'schema_version',
      'collection_reset_epoch',
    ])

    for (const table of tablesResult as { name: string }[]) {
      const tableName = table.name

      if (tableName && !systemTables.has(tableName)) {
        // oxlint-disable-next-line no-await-in-loop -- sequential DELETEs on a single SQLite connection, no parallelism benefit
        await database.execute(`DELETE FROM "${tableName}";`)
      }
    }

    await database.execute('PRAGMA foreign_keys = ON;')
    await database.execute('VACUUM;')
  } catch (error) {
    posthog.captureException(error)
    await database.execute('PRAGMA foreign_keys = ON;').catch(() => {})
  }
}

if (import.meta.env.DEV) {
  async function getCollectionTableName(name: string) {
    const collections = (await database.execute('SELECT * FROM collection_registry')) as {
      collection_id: string
      table_name: string
      schema_version: number
    }[]
    const matching = collections.filter(c => c.collection_id === name)
    if (matching.length === 0) return undefined

    return matching.toSorted((a, b) => b.schema_version - a.schema_version)[0]!.table_name
  }

  async function showCollection(name: string) {
    const tableName = await getCollectionTableName(name)
    if (!tableName) {
      return
    }

    const collection = (await database.execute(`SELECT * FROM ${tableName}`)) as {
      key: string
      metadata: unknown
      row_version: number
      value: string
    }[]

    // oxlint-disable-next-line no-console
    console.log(collection.map(c => JSON.parse(c.value)))
  }

  // @ts-expect-error window is not typed
  window.showCollection = showCollection
}
