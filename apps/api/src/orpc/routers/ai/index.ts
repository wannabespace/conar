import { orpc } from '~/orpc'
import { chat } from './chat'
import { enhancePrompt } from './enhance-prompt'
import { filters } from './filters'

export const ai = orpc.router({
  chat,
  enhancePrompt,
  filters,
})
