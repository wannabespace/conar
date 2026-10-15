import { GITHUB_REPO_NAME } from '@tamery/shared/constants'
import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
} from '@tanstack/browser-db-sqlite-persistence'
import { Result } from 'better-result'

import { posthog } from './posthog'

const DATABASE_NAME = `${GITHUB_REPO_NAME}.sqlite`

const OPEN_DATABASE_RETRIES = 2
const OPEN_DATABASE_RETRY_DELAY = 500

// OPFSCoopSyncVFS init can throw NoModificationAllowedError on a reloaded or
// crashed tab's `.ahp-*` dir until the browser frees its handles a beat later.
const databaseResult = await Result.tryPromise(
  () => openBrowserWASQLiteOPFSDatabase({ databaseName: DATABASE_NAME }),
  {
    retry: {
      backoff: 'linear',
      delayMs: OPEN_DATABASE_RETRY_DELAY,
      times: OPEN_DATABASE_RETRIES,
    },
  }
)

if (databaseResult.isErr()) {
  posthog.captureException(databaseResult.error)
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
