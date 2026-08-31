import { createHooks } from 'hookable'

export const globalHooks = createHooks<{
  refreshPressed: () => void
  savePressed: () => void
}>()
