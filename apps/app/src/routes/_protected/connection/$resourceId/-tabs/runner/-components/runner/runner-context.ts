import { createContext, use } from 'react'

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

export const useRunnerContext = () => {
  const context = use(RunnerContext)
  if (!context) {
    throw new Error('RunnerContext is not provided')
  }
  return context
}
