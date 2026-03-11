import type { ContextSelector } from '@fluentui/react-context-selector'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

export interface QueryToRun {
  startLineNumber: number
  endLineNumber: number
  query: string
}

interface RunnerContextType {
  run: (queries: QueryToRun[]) => void
  runExplain: (queries: QueryToRun[]) => void
  save: (query: string) => void
}

export const RunnerContext = createContext<RunnerContextType>(null!)

export function useRunnerContext<T>(selector: ContextSelector<RunnerContextType, T>) {
  return useContextSelector(RunnerContext, selector)
}
