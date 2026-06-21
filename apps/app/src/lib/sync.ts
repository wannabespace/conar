import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { BrowserCollectionCoordinator, createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'
import { posthog } from './posthog'

export interface BaseTable {
  id: string
  createdAt: Date
  updatedAt: Date
}

const DATABASE_NAME = `${GITHUB_REPO_NAME}.sqlite`

// eslint-disable-next-line antfu/no-top-level-await
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
        await database.execute(`DELETE FROM "${tableName}";`)
      }
    }

    await database.execute('PRAGMA foreign_keys = ON;')
    await database.execute('VACUUM;')
  }
  catch (error) {
    posthog.captureException(error)
    await database.execute('PRAGMA foreign_keys = ON;').catch(() => {})
  }
}

if (import.meta.env.DEV) {
  async function getCollectionTableName(name: string) {
    const collections = await database.execute('SELECT * FROM collection_registry') as { collection_id: string, table_name: string, schema_version: number }[]
    const matching = collections.filter(c => c.collection_id === name)
    if (matching.length === 0)
      return undefined

    return matching.toSorted((a, b) => b.schema_version - a.schema_version)[0]!.table_name
  }

  async function showCollection(name: string) {
    const tableName = await getCollectionTableName(name)
    if (!tableName) {
      return
    }

    const collection = await database.execute(`SELECT * FROM ${tableName}`) as { key: string, metadata: unknown, row_version: number, value: string }[]

    // eslint-disable-next-line no-console
    console.log(collection.map(c => JSON.parse(c.value)))
  }

  // @ts-expect-error window is not typed
  window.showCollection = showCollection
}
