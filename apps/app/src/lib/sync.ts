import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { BrowserCollectionCoordinator, createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'
import { connectionStringStorage } from '~/lib/connection-string-storage'
import { posthog } from '~/lib/posthog'

const DATABASE_NAME = `${GITHUB_REPO_NAME}.sqlite`

// eslint-disable-next-line antfu/no-top-level-await
export const database = await openBrowserWASQLiteOPFSDatabase({
  databaseName: DATABASE_NAME,
})

const coordinator = new BrowserCollectionCoordinator({
  dbName: DATABASE_NAME,
})

export const persistence = createBrowserWASQLitePersistence({
  database,
  coordinator,
  schemaMismatchPolicy: 'reset',
})

if (import.meta.env.DEV) {
  async function showCollectionData(name: string) {
    const collections = await database.execute('SELECT * FROM collection_registry') as { collection_id: string, table_name: string, schema_version: number }[]
    const collection = await database.execute(`SELECT * FROM ${collections.find(c => c.collection_id === name)?.table_name}`) as { key: string, metadata: unknown, row_version: number, value: string }[]

    // eslint-disable-next-line no-console
    console.log(collection.map(c => JSON.parse(c.value)))
  }

  // @ts-expect-error window is not typed
  window.showCollection = showCollectionData
}

export async function clearDb() {
  const root = await navigator.storage.getDirectory()
  const names = [
    `${DATABASE_NAME}`,
    `${DATABASE_NAME}-journal`,
    `${DATABASE_NAME}-wal`,
  ]
  await database.close?.()
  for (const name of names) {
    try {
      await root.removeEntry(name)
    }
    catch (error) {
      posthog.captureException(error)
      console.error(error)
    }
  }
  await connectionStringStorage.clear()
}
