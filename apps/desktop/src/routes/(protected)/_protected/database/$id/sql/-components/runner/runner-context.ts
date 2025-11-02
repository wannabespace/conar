import type { ContextSelector } from '@fluentui/react-context-selector'
import { createContext, useContextSelector } from '@fluentui/react-context-selector'

interface RunnerContextType {
  run: (queries: {
    startLineNumber: number
    endLineNumber: number
    sql: string
  }[]) => void
  save: (sql: string) => void
}

export const RunnerContext = createContext<RunnerContextType>(null!)

export function useRunnerContext<T>(selector: ContextSelector<RunnerContextType, T>) {
  return useContextSelector(RunnerContext, selector)
}
