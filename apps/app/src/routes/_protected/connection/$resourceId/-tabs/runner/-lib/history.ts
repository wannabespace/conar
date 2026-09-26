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

const HISTORY_LIMIT = 200

const getResourceStore = memoize((resourceId: string) =>
  createWebStorageValue({
    defaultValue: [],
    key: `${resourceId}.history`,
    schema: entryType.array(),
    type: 'localStorage',
  })
)

export const runHistory = {
  add: (resourceId: string, runs: Omit<HistoryEntry, 'id'>[]) => {
    const added = runs
      .map((run) => ({ ...run, id: crypto.randomUUID() }))
      .toReversed()
    const sqls = new Set(runs.map((run) => run.sql))
    getResourceStore(resourceId).set((history) =>
      [...added, ...history.filter((entry) => !sqls.has(entry.sql))].slice(
        0,
        HISTORY_LIMIT
      )
    )
  },
  clear: (resourceId: string) => getResourceStore(resourceId).set([]),
  get: getResourceStore,
  remove: (resourceId: string, id: string) =>
    getResourceStore(resourceId).set((history) =>
      history.filter((entry) => entry.id !== id)
    ),
}
