import { createHooks } from 'hookable'

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
