import type { AiSqlChatModel } from '@conar/shared/enums/ai-chat-model'
import { Store } from '@tanstack/react-store'
import { createHooks } from 'hookable'

export const pageStore = new Store({
  query: '',
  files: [] as File[],
  model: 'auto' as AiSqlChatModel | 'auto',
})

export const pageHooks = createHooks<{
  fix: (error: string) => Promise<void>
  sendMessage: () => void
  focusRunner: () => void
}>()
