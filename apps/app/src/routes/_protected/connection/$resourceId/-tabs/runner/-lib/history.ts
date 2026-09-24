import { type } from 'arktype'
import { memoize } from 'memoza'
import { createWebStorageValue } from 'seitu/web'

const entryType = type({
  duration: 'number',
  error: 'string | null',
  id: 'string',
  ranAt: 'number',
  sql: 'string',
})

export type HistoryEntry = typeof entryType.infer

/** Enough to find last week's statement while one resource's history stays a few hundred KB of localStorage. */
const HISTORY_LIMIT = 200

const storeOf = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: [],
    key: `${resourceId}.history`,
    schema: entryType.array(),
    type: 'localStorage',
  })
)

/** Statements run against a resource, newest first; re-running one moves it to the top. */
export const runHistory = {
  add: (resourceId: string, runs: Omit<HistoryEntry, 'id'>[]) => {
    const added = runs
      .map((run) => ({ ...run, id: crypto.randomUUID() }))
      .toReversed()
    const sqls = new Set(runs.map((run) => run.sql))
    storeOf(resourceId).set((history) =>
      [...added, ...history.filter((entry) => !sqls.has(entry.sql))].slice(
        0,
        HISTORY_LIMIT
      )
    )
  },
  clear: (resourceId: string) => storeOf(resourceId).set([]),
  of: storeOf,
}
