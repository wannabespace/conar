import { router } from '~/trpc'
import { sqlEnhancePrompt } from './sql-enhance-prompt'
import { sqlFilters } from './sql-filters'

export const aiRouter = router({
  sqlFilters,
  sqlEnhancePrompt,
})
