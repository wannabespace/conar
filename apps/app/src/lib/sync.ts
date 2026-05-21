import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'
import { posthog } from '~/lib/posthog'

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

export const persistence = createBrowserWASQLitePersistence({
  database,
  schemaMismatchPolicy: 'reset',
})

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
}
