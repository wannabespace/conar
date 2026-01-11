import { ask } from './ask__legacy'
import { enhancePrompt } from './enhance-prompt'
import { filters } from './filters'
import { fixSQL } from './fix-sql'
import { generateTitle } from './generate-title'
import { updateSQL } from './update-sql'

export const ai = {
  ask,
  enhancePrompt,
  filters,
  generateTitle,
  updateSQL,
  fixSQL,
}
