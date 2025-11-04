import { ask } from './ask'
import { enhancePrompt } from './enhance-prompt'
import { filters } from './filters'
import { fixSQL } from './fix-sql'
import { generateTitle } from './generate-title'
import { resumeStream } from './resume-stream'
import { updateSQL } from './update-sql'

export const ai = {
  ask,
  enhancePrompt,
  filters,
  generateTitle,
  updateSQL,
  fixSQL,
  resumeStream,
}
