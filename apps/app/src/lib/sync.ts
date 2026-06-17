import type { ElectricCollectionConfig } from '@tanstack/electric-db-collection'
import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { snakeCamelMapper } from '@electric-sql/client'
import { BrowserCollectionCoordinator, createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'
import { apiUrl } from '~/utils/utils'
import { bearerToken } from './auth'
import { connectionStringStorage } from './connection-string-storage'
import { posthog } from './posthog'

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

export function shapeOptions(entity: string) {
  return {
    url: new URL(`/shapes/${entity}`, apiUrl).toString(),
    columnMapper: snakeCamelMapper(),
    liveSse: true,
    headers: {
      Authorization: () => {
        const token = bearerToken.get()
        return token ? `Bearer ${token}` : ''
      },
    },
    fetchClient: ((url, init) => globalThis.fetch(url, {
      ...init,
      credentials: 'include',
    })) as typeof fetch,
  } satisfies ElectricCollectionConfig['shapeOptions']
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

async function getCollectionTableName(name: string) {
  const collections = await database.execute('SELECT * FROM collection_registry') as { collection_id: string, table_name: string, schema_version: number }[]
  const matching = collections.filter(c => c.collection_id === name)
  if (matching.length === 0)
    return undefined

  return matching.toSorted((a, b) => b.schema_version - a.schema_version)[0]!.table_name
}

export async function truncateCollectionData(name: string) {
  const tableName = await getCollectionTableName(name)
  if (!tableName) {
    return
  }

  await database.execute(`DELETE FROM ${tableName}`)

  // eslint-disable-next-line no-console
  console.log(`Truncated collection "${name}" (${tableName})`)
}

if (import.meta.env.DEV) {
  async function showCollectionData(name: string) {
    const tableName = await getCollectionTableName(name)
    if (!tableName) {
      return
    }

    const collection = await database.execute(`SELECT * FROM ${tableName}`) as { key: string, metadata: unknown, row_version: number, value: string }[]

    // eslint-disable-next-line no-console
    console.log(collection.map(c => JSON.parse(c.value)))
  }

  // @ts-expect-error window is not typed
  window.showCollection = showCollectionData
}
