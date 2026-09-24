import { createContext, use } from 'react'

import type { Query } from '~/entities/query/sync'

import type { RunnerResult } from './run'

/** What the editor exposes to the toolbar, results and menus. */
export interface RunnerActions {
  /** Runs the selection when there is one, else the statement under the caret. */
  runCurrent: () => void
  runAll: () => void
  explainCurrent: () => void
  saveCurrent: () => void
  saveAll: () => void
  renameSaved: (query: Query) => void
  format: () => void
  askAi: () => void
  /** Puts an AI rewrite of `statement` in the editor for review. */
  fixWithAi: (result: RunnerResult & { error: string }) => void
  focus: () => void
}

export const RunnerActionsContext = createContext<RunnerActions | null>(null)

export const useRunnerActions = () => {
  const actions = use(RunnerActionsContext)
  if (!actions) {
    throw new Error('RunnerActionsContext is not provided')
  }
  return actions
}
