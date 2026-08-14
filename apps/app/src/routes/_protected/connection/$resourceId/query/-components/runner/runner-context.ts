import type { ContextSelector } from '@fluentui/react-context-selector'
import {
  createContext,
  useContextSelector,
} from '@fluentui/react-context-selector'

export interface QueryToRun {
  startLineNumber: number
  endLineNumber: number
  query: string
}

interface RunnerContextType {
  run: (queries: QueryToRun[]) => void
  save: (query: string) => void
}

export const RunnerContext = createContext<RunnerContextType | null>(null)

export const useRunnerContext = <T>(
  selector: ContextSelector<RunnerContextType, T>
) =>
  useContextSelector(RunnerContext, (context) => {
    if (!context) {
      throw new Error('RunnerContext is not provided')
    }
    return selector(context)
  })
