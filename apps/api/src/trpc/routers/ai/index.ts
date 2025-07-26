import { router } from '~/trpc'
import { enhancePrompt } from './enhance-prompt'
import { filters } from './filters'

export const aiRouter = router({
  /**
   * @deprecated Use filters instead
   */
  sqlFilters: filters,
  filters,
  enhancePrompt,
})
