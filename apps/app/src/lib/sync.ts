import { GITHUB_REPO_NAME } from '@tamery/shared/constants'
import { sleep } from '@tamery/shared/utils/helpers'
import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from '@tanstack/browser-db-sqlite-persistence'
import type { SyncConfig } from '@tanstack/react-db'
import { BasicIndex } from '@tanstack/react-db'
import { Result } from 'better-result'

import { isUnauthorizedError } from '../utils/error'
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

export type SyncUtils = Pick<SyncTracker, 'awaitChange'> & {
  whenSynced: () => Promise<void>
}

const versionKey = (key: string, updatedAt: Date) =>
  `${key}:${updatedAt.getTime()}`

export const createSyncTracker = (): SyncTracker => {
  const synced = new Set<string>()
  const listeners = new Set<() => void>()

  return {
    awaitChange(key, updatedAt, timeout = 10_000) {
      const versioned = versionKey(key, updatedAt)

      if (synced.has(versioned)) {
        return Promise.resolve()
      }

      const { promise, resolve, reject } = Promise.withResolvers<undefined>()

      const listener = () => {
        if (synced.has(versioned)) {
          resolve()
        }
      }

      const timer = setTimeout(() => {
        reject(new Error('awaitChange timed out'))
      }, timeout)

      listeners.add(listener)

      return promise.finally(() => {
        clearTimeout(timer)
        listeners.delete(listener)
      })
    },
    markSynced(key, updatedAt) {
      synced.add(versionKey(key, updatedAt))
      for (const listener of listeners) {
        listener()
      }
    },
  }
}

const DATABASE_NAME = `${GITHUB_REPO_NAME}.sqlite`

const OPEN_DATABASE_RETRIES = 2
const OPEN_DATABASE_RETRY_DELAY = 500

// OPFSCoopSyncVFS init deletes `.ahp-*` temp dirs whose Web Lock is free, i.e.
// those left by a crashed or reloaded tab. The lock drops before the browser
// reclaims that tab's sync access handles, so `removeEntry` can still throw
// NoModificationAllowedError (INTERNAL -> OPFSWorkerRequestError) on a dir it
// was right to delete. The handles are released within a beat: retry.
const databaseResult = await Result.tryPromise(
  () => openBrowserWASQLiteOPFSDatabase({ databaseName: DATABASE_NAME }),
  {
    retry: {
      backoff: 'linear',
      delayMs: OPEN_DATABASE_RETRY_DELAY,
      shouldRetry: (error) => {
        posthog.captureException(error)
        return true
      },
      times: OPEN_DATABASE_RETRIES,
    },
  }
)

if (databaseResult.isErr()) {
  throw databaseResult.error
}

export const database = databaseResult.value

if (import.meta.env.DEV) {
  // @ts-expect-error window is not typed
  window.database = database
}

const coordinator = new BrowserCollectionCoordinator({
  dbName: DATABASE_NAME,
})

export const persistence = createBrowserWASQLitePersistence({
  coordinator,
  database,
  schemaMismatchPolicy: 'reset',
})

export type SyncMessage<T> =
  | { type: 'insert'; value: T }
  | { type: 'update'; value: T }
  | { type: 'delete'; key: string }

type MutationFn<T> = (params: {
  transaction: {
    mutations: { key: string; modified: T; changes: Partial<T> }[]
  }
}) => Promise<void>

export type SyncEventsFn<T> = (params: {
  signal: AbortSignal
  write: (message: SyncMessage<T>) => void
}) => void | Promise<void>

const RETRY_MIN_DELAY = 1000
const RETRY_MAX_DELAY = 30_000

export interface SyncCollectionConfig<T extends { updatedAt: Date }> {
  id: string
  getKey: (item: T) => string
  events: SyncEventsFn<T>
  sync: (params: {
    rows: T[]
    signal: AbortSignal
  }) => Promise<SyncMessage<T>[]>
  onInsert?: MutationFn<T>
  onUpdate?: MutationFn<T>
  onDelete?: MutationFn<T>
}

export const syncCollectionOptions = <T extends { updatedAt: Date }>(
  config: SyncCollectionConfig<T>
) => {
  const tracker = createSyncTracker()
  const firstSync = Promise.withResolvers<undefined>()

  const sync: SyncConfig<T, string> = {
    sync: ({ begin, commit, write, collection, markReady }) => {
      const abortController = new AbortController()
      const { signal } = abortController

      const writeItem = (item: SyncMessage<T>) => {
        if (item.type === 'delete') {
          write({ key: item.key, type: 'delete' })
          return
        }
        write({ type: item.type, value: item.value })
        tracker.markSynced(config.getKey(item.value), item.value.updatedAt)
      }

      const writeItems = (items: SyncMessage<T>[]) => {
        if (signal.aborted) {
          return
        }
        begin()
        for (const item of items) {
          writeItem(item)
        }
        commit()
      }

      const catchUp = async () => {
        const result = await Result.tryPromise({
          catch: (error) => error,
          try: async () => {
            const rows = await collection.toArrayWhenReady()
            writeItems(await config.sync({ rows, signal }))
          },
        })

        if (result.isErr() && !signal.aborted) {
          if (isUnauthorizedError(result.error)) {
            abortController.abort(`${config.id} sync unauthorized`)
          } else {
            posthog.captureException(result.error)
          }
        }

        firstSync.resolve()
      }

      const run = async () => {
        let failures = 0

        while (!signal.aborted) {
          // oxlint-disable-next-line no-await-in-loop
          const result = await Result.tryPromise({
            catch: (error) => error,
            try: () =>
              Promise.all([
                catchUp(),
                config.events({ signal, write: (item) => writeItems([item]) }),
              ]),
          })

          if (result.isOk()) {
            failures = 0
          } else if (signal.aborted) {
            return
          } else if (isUnauthorizedError(result.error)) {
            abortController.abort(`${config.id} sync unauthorized`)
            return
          } else {
            posthog.captureException(result.error)
            failures += 1
          }

          // oxlint-disable-next-line no-await-in-loop
          await sleep(
            Math.min(RETRY_MIN_DELAY * 2 ** failures, RETRY_MAX_DELAY),
            signal
          )
        }
      }

      markReady()
      run()

      return () => {
        abortController.abort(`${config.id} sync aborted`)
        firstSync.resolve()
      }
    },
  }

  return {
    autoIndex: 'eager' as const,
    defaultIndexType: BasicIndex,
    getKey: config.getKey,
    id: config.id,
    onDelete: config.onDelete,
    onInsert: config.onInsert,
    onUpdate: config.onUpdate,
    sync,
    utils: {
      awaitChange: tracker.awaitChange,
      whenSynced: () => firstSync.promise,
    },
  }
}

export const clearDb = async () => {
  const result = await Result.tryPromise({
    catch: (error) => error,
    try: async () => {
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
          // Sequential by design: statements run on a single SQLite connection
          // oxlint-disable-next-line no-await-in-loop
          await database.execute(`DELETE FROM "${tableName}";`)
        }
      }

      await database.execute('PRAGMA foreign_keys = ON;')
      await database.execute('VACUUM;')
    },
  })

  if (result.isErr()) {
    posthog.captureException(result.error)
    await Result.tryPromise(() => database.execute('PRAGMA foreign_keys = ON;'))
  }
}

if (import.meta.env.DEV) {
  const getCollectionTableName = async (name: string) => {
    const collections = (await database.execute(
      'SELECT * FROM collection_registry'
    )) as {
      collection_id: string
      table_name: string
      schema_version: number
    }[]
    const matching = collections.filter((c) => c.collection_id === name)
    if (matching.length === 0) {
      return
    }

    const [latest] = matching.toSorted(
      (a, b) => b.schema_version - a.schema_version
    )
    return latest?.table_name
  }

  const showCollection = async (name: string) => {
    const tableName = await getCollectionTableName(name)
    if (!tableName) {
      return
    }

    const collection = (await database.execute(
      `SELECT * FROM ${tableName}`
    )) as {
      key: string
      metadata: unknown
      row_version: number
      value: string
    }[]

    // oxlint-disable-next-line no-console
    console.log(collection.map((c) => JSON.parse(c.value)))
  }

  // @ts-expect-error window is not typed
  window.showCollection = showCollection
}
