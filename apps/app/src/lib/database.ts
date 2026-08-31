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
