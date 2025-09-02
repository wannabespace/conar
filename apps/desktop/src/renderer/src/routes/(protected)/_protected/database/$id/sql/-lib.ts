import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'

const QUERIES_OPENED_STORAGE_KEY = 'queries-opened'

export const pageStore = new Store({
  query: '',
  files: [] as File[],
  queriesOpen: JSON.parse(localStorage.getItem(QUERIES_OPENED_STORAGE_KEY) ?? 'false'),
})

pageStore.subscribe((state) => {
  localStorage.setItem(QUERIES_OPENED_STORAGE_KEY, JSON.stringify(state.currentVal.queriesOpen))
})

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
