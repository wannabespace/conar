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
  replaceQuery: ({ query, startLineNumber, endLineNumber }: { query: string, startLineNumber: number, endLineNumber: number }) => void
}>()
