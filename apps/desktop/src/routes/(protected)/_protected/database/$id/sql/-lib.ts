import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'

export const pageStore = new Store({
  query: '',
  files: [] as File[],
})

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
