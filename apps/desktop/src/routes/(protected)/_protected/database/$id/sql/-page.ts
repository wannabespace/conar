import { createHooks } from 'hookable'

export const chatHooks = createHooks<{
  scrollToBottom: () => void
}>()

export const runnerHooks = createHooks<{
  focus: (lineNumber?: number) => void
  scrollToLine: (lineNumber: number) => void
  scrollToBottom: () => void
  appendToBottom: (query: string) => void
  appendToBottomAndFocus: (query: string) => void
  replaceQuery: ({ sql, startLineNumber, endLineNumber }: { sql: string, startLineNumber: number, endLineNumber: number }) => void
}>()
