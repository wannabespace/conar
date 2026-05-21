import { GITHUB_REPO_NAME } from '@conar/shared/constants'
import { createBrowserWASQLitePersistence, openBrowserWASQLiteOPFSDatabase } from '@tanstack/browser-db-sqlite-persistence'

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
// @ts-expect-error custom
  window.dbQuery = (query: string) => {
    database.execute(query).then((result) => {
      // eslint-disable-next-line no-console
      console.table(result)
      return result
    })
  }
}

export const persistence = createBrowserWASQLitePersistence({
  database,
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
    await root.removeEntry(name)
  }
}
