import { orpc } from '~/orpc'
import { ask } from './ask'
import { enhancePrompt } from './enhance-prompt'
import { filters } from './filters'
import { generateTitle } from './generate-title'

export const ai = orpc.router({
  ask,
  enhancePrompt,
  filters,
  generateTitle,
})
