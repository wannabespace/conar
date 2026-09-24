import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'
import { type } from 'arktype'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createComputed } from 'seitu'
import { createWebStorageValue } from 'seitu/web'

import { runnerStoreKey } from '~/entities/connection/store/tabs/ids'
import { RUNNER_RESULTS_DEFAULT_HEIGHT } from '~/lib/constants'

export const runnerPageType = type({
  layout: {
    resultsHeight: ['number', '=', RUNNER_RESULTS_DEFAULT_HEIGHT],
    resultsVisible: 'boolean',
  },
  query: 'string',
  /** The saved query this tab was opened from; saving the tab then updates it. */
  'savedQueryId?': 'string',
})

const defaultState: typeof runnerPageType.infer = {
  layout: {
    resultsHeight: RUNNER_RESULTS_DEFAULT_HEIGHT,
    resultsVisible: true,
  },
  query: '',
}

export interface RunnerTab {
  resourceId: string
  tabId: string
}

export const runnerPageStore = memoize(({ resourceId, tabId }: RunnerTab) =>
  createWebStorageValue({
    defaultValue: defaultState,
    key: runnerStoreKey(resourceId, tabId),
    schema: runnerPageType,
    type: 'localStorage',
  })
)

export type RunnerPageStore = ReturnType<typeof runnerPageStore>

export const runnerStatements = memoize(
  ({
    connectionType,
    resourceId,
    tabId,
  }: RunnerTab & { connectionType: ConnectionType }) =>
    createComputed(runnerPageStore({ resourceId, tabId }), (state) =>
      splitStatements(state.query, dialects[connectionType])
    )
)

export const RunnerTabContext = createContext<RunnerTab | null>(null)

export const useRunnerTab = () => {
  const tab = use(RunnerTabContext)
  if (!tab) {
    throw new Error('RunnerTabContext is not provided')
  }
  return tab
}

export const useRunnerPageStore = () => runnerPageStore(useRunnerTab())

export const setQuery = (store: RunnerPageStore, query: string) => {
  if (store.get().query !== query) {
    store.set((state) => ({ ...state, query }) satisfies typeof state)
  }
}

export const appendQuery = (store: RunnerPageStore, sql: string) => {
  const existing = store.get().query.trimEnd()
  setQuery(store, existing ? `${existing}\n\n${sql}` : sql)
}

export const linkSavedQuery = (
  store: RunnerPageStore,
  savedQueryId: string | undefined
) => {
  store.set((state) => {
    const { savedQueryId: _previous, ...rest } = state
    return savedQueryId ? { ...rest, savedQueryId } : rest
  })
}

export const setLayout = (
  store: RunnerPageStore,
  patch: Partial<(typeof runnerPageType.infer)['layout']>
) => {
  store.set(
    (state) =>
      ({
        ...state,
        layout: { ...state.layout, ...patch } satisfies typeof state.layout,
      }) satisfies typeof state
  )
}
