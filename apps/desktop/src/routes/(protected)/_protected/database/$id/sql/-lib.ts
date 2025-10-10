import { Derived, Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'
import { getSQLQueries } from '~/entities/database'

export const pageStore = new Store({
  sql: '',
  queriesToRun: [] as string[],
  selectedLines: [] as number[],
  files: [] as File[],
})

export const queries = new Derived({
  fn: ({ currDepVals }) => getSQLQueries(currDepVals[0].sql),
  deps: [pageStore],
})

queries.mount()

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
