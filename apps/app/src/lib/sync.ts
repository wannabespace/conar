import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { BrowserCollectionCoordinator, createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'

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
  // const root = await navigator.storage.getDirectory()

  // const sqliteDir = await root.getDirectoryHandle('sqlite3-dir', { create: false })
  // for await (const entry of sqliteDir.values()) {
  //   if (entry.kind === 'file' && entry.name.startsWith(DATABASE_NAME)) {
  //     await sqliteDir.removeEntry(entry.name)
  //   }
  // }
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
