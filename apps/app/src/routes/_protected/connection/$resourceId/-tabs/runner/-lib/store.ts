import { type } from 'arktype'
import { memoize } from 'memoza'
import { createContext, use } from 'react'
import { createComputed } from 'seitu'
import { createWebStorageValue } from 'seitu/web'

import { getEditorQueries } from '~/entities/connection/utils'

export const runnerPageType = type({
  chatId: 'string.uuid | null',
  layout: {
    chatPosition: '"left" | "right"',
    chatVisible: 'boolean',
    resultsVisible: 'boolean',
  },
  queriesToRun: type({
    endLineNumber: 'number',
    query: 'string',
    startLineNumber: 'number',
  }).array(),
  query: 'string',
  selectedLines: 'number[]',
})

const DEFAULT_QUERY = [
  '-- Write your SQL query here based on your database schema',
  '-- The examples below are for reference only and may not work with your database',
  '',
  '-- Example: Basic query with limit',
  'SELECT * FROM users LIMIT 10;',
  '',
  '-- Example: Query with filtering',
  "SELECT id, name, email FROM users WHERE created_at > '2025-01-01' ORDER BY name;",
  '',
  '-- Example: Join example',
  'SELECT u.id, u.name, p.title FROM users u',
  'JOIN posts p ON u.id = p.user_id',
  'WHERE p.published = true',
  'LIMIT 10;',
].join('\n')

const defaultState: typeof runnerPageType.infer = {
  chatId: null,
  layout: {
    chatPosition: 'right',
    chatVisible: true,
    resultsVisible: true,
  },
  queriesToRun: [],
  query: DEFAULT_QUERY,
  selectedLines: [],
}

export const runnerPageStore = memoize(
  ({ resourceId, tabId }: { resourceId: string; tabId: string }) =>
    createWebStorageValue({
      defaultValue: defaultState,
      key: `${resourceId}.${tabId}.store`,
      schema: runnerPageType,
      type: 'localStorage',
    })
)

export type RunnerPageStore = ReturnType<typeof runnerPageStore>

export const getEditorQueriesComputed = memoize(
  ({ resourceId, tabId }: { resourceId: string; tabId: string }) => {
    const store = runnerPageStore({ resourceId, tabId })
    const computed = createComputed(store, (state) =>
      getEditorQueries(state.query)
    )

    computed.subscribe((editorQueries) => {
      const state = store.get()
      const currentLineNumbers = new Set(
        editorQueries.map((query) => query.startLineNumber)
      )
      const newSelectedLines = state.selectedLines.filter((line) =>
        currentLineNumbers.has(line)
      )

      if (
        newSelectedLines.length !== state.selectedLines.length ||
        newSelectedLines.some((line, i) => line !== state.selectedLines[i])
      ) {
        store.set(
          (currentState) =>
            ({
              ...currentState,
              selectedLines: newSelectedLines.toSorted((a, b) => a - b),
            }) satisfies typeof currentState
        )
      }
    })

    return computed
  }
)

export interface RunnerTab {
  resourceId: string
  tabId: string
}

export const RunnerTabContext = createContext<RunnerTab | null>(null)

export const useRunnerTab = () => {
  const tab = use(RunnerTabContext)
  if (!tab) {
    throw new Error('RunnerTabContext is not provided')
  }
  return tab
}

export const useRunnerPageStore = () => runnerPageStore(useRunnerTab())

export const useEditorQueriesComputed = () =>
  getEditorQueriesComputed(useRunnerTab())

export const toggleChat = (store: RunnerPageStore, isVisible?: boolean) => {
  store.set(
    (state) =>
      ({
        ...state,
        layout: {
          ...state.layout,
          chatVisible: isVisible ?? !state.layout.chatVisible,
        } satisfies typeof state.layout,
      }) satisfies typeof state
  )
}

export const toggleResults = (store: RunnerPageStore) => {
  store.set(
    (state) =>
      ({
        ...state,
        layout: {
          ...state.layout,
          resultsVisible: !state.layout.resultsVisible,
        } satisfies typeof state.layout,
      }) satisfies typeof state
  )
}

export const setChatPosition = (
  store: RunnerPageStore,
  chatPosition: (typeof runnerPageType.infer)['layout']['chatPosition']
) => {
  store.set(
    (state) =>
      ({
        ...state,
        layout: {
          ...state.layout,
          chatPosition,
        } satisfies typeof state.layout,
      }) satisfies typeof state
  )
}
