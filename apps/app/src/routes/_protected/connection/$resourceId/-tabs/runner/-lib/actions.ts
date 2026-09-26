import { createContext, use } from 'react'

import type { Query } from '~/entities/query/sync'

import type { RunnerResult } from './run'

export interface RunnerActions {
  runCurrent: () => void
  runAll: () => void
  explainCurrent: () => void
  saveCurrent: () => void
  saveAll: () => void
  renameSaved: (query: Query) => void
  format: () => void
  askAi: () => void
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
